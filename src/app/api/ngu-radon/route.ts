import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildWmsGetFeatureInfoUrl } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NguRadonResultat } from "@/types";

function parseRadonGml(text: string): NguRadonResultat {
  // GML response contains fields like:
  // <aktsomhetgrad>2</aktsomhetgrad>
  // <aktsomhetgrad_besk>Hoy aktsomhet</aktsomhetgrad_besk>

  if (text.includes("Search returned no results") || !text.includes("aktsomhetgrad")) {
    return { nivaaTekst: "Ukjent", nivaa: "ukjent", detaljer: "Ingen radondata for dette området" };
  }

  const gradMatch = text.match(/<aktsomhetgrad>(\d+)<\/aktsomhetgrad>/);
  const beskMatch = text.match(/<aktsomhetgrad_besk>([^<]+)<\/aktsomhetgrad_besk>/);

  const grad = gradMatch ? parseInt(gradMatch[1]) : -1;
  const beskrivelse = beskMatch ? beskMatch[1].trim() : "";

  if (grad >= 2) {
    return { nivaaTekst: "Høy", nivaa: "hoy", detaljer: beskrivelse || "Høy aktsomhet for radon" };
  }
  if (grad === 1) {
    return { nivaaTekst: "Moderat til lav", nivaa: "moderat", detaljer: beskrivelse || "Moderat til lav aktsomhet for radon" };
  }
  if (grad === 0) {
    return { nivaaTekst: "Usikker", nivaa: "ukjent", detaljer: beskrivelse || "Usikker aktsomhet for radon" };
  }

  // Fallback: try to parse from description text
  const lower = (beskrivelse || text).toLowerCase();
  if (lower.includes("hoy") || lower.includes("høy") || lower.includes("high")) {
    return { nivaaTekst: "Høy", nivaa: "hoy", detaljer: beskrivelse };
  }
  if (lower.includes("moderat") || lower.includes("lav")) {
    return { nivaaTekst: "Moderat til lav", nivaa: "lav", detaljer: beskrivelse };
  }

  return { nivaaTekst: "Ukjent", nivaa: "ukjent", detaljer: beskrivelse || "Kunne ikke tolke radondata" };
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
    const resultat = parseRadonGml(text);

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
