import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildWmsGetFeatureInfoUrl } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NguRadonResultat } from "@/types";

function parseRadonResponse(text: string): NguRadonResultat {
  const lower = text.toLowerCase();

  if (lower.includes("høy") || lower.includes("hoy") || lower.includes("high")) {
    return { nivaaTekst: "Høy", nivaa: "hoy", detaljer: text.trim() };
  }
  if (lower.includes("moderat") || lower.includes("moderate") || lower.includes("middels")) {
    return { nivaaTekst: "Moderat", nivaa: "moderat", detaljer: text.trim() };
  }
  if (lower.includes("lav") || lower.includes("low") || lower.includes("usannsynlig")) {
    return { nivaaTekst: "Lav", nivaa: "lav", detaljer: text.trim() };
  }

  return { nivaaTekst: "Ukjent", nivaa: "ukjent", detaljer: text.trim() || "Ingen data funnet" };
}

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "0");
  const lon = parseFloat(request.nextUrl.searchParams.get("lon") || "0");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Mangler koordinater (lat, lon)" },
      { status: 400 }
    );
  }

  try {
    const url = buildWmsGetFeatureInfoUrl(
      API_URLS.nguRadon,
      "Radon_aktsomhet",
      lat,
      lon
    );

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return NextResponse.json(
        { nivaaTekst: "Ukjent", nivaa: "ukjent", detaljer: "Kunne ikke hente radondata" } as NguRadonResultat
      );
    }

    const text = await response.text();
    const resultat = parseRadonResponse(text);

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot NGU Radon" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { nivaaTekst: "Ukjent", nivaa: "ukjent", detaljer: "Feil ved oppslag" } as NguRadonResultat
    );
  }
}
