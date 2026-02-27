import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildWmsGetFeatureInfoUrl } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NguGrunnResultat } from "@/types";

function parseGrunnResponse(text: string): NguGrunnResultat {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Look for jordart/løsmasse type in the response
  let jordart = "Ukjent";
  let beskrivelse = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Common patterns in NGU WMS text/plain responses
    if (lower.includes("jordart") || lower.includes("løsmasse") || lower.includes("losmasse")) {
      const parts = line.split(/[=:]/);
      if (parts.length > 1) {
        jordart = parts[1].trim().replace(/^'|'$/g, "");
      }
    }
    if (lower.includes("beskrivelse") || lower.includes("navn")) {
      const parts = line.split(/[=:]/);
      if (parts.length > 1) {
        beskrivelse = parts[1].trim().replace(/^'|'$/g, "");
      }
    }
  }

  // If no specific field found, try to extract from first meaningful line
  if (jordart === "Ukjent" && lines.length > 0) {
    for (const line of lines) {
      if (!line.startsWith("GetFeatureInfo") && !line.startsWith("Layer") && line.length > 2) {
        // Check if it contains a known soil type
        const knownTypes = [
          "Marin", "Hav", "Morene", "Fjell", "Torv", "Leire", "Sand", "Grus",
          "Elveavsetning", "Breelv", "Forvitring", "Fyllmasse", "Innsjø", "Strandsediment",
        ];
        for (const type of knownTypes) {
          if (line.includes(type)) {
            jordart = line.includes("=") ? line.split("=")[1].trim() : line;
            break;
          }
        }
        if (jordart !== "Ukjent") break;
      }
    }
  }

  return {
    jordart,
    beskrivelse: beskrivelse || jordart,
    detaljer: text.trim() || "Ingen data funnet",
  };
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
      API_URLS.nguLosmasser,
      "Losmasse_flate",
      lat,
      lon
    );

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return NextResponse.json({
        jordart: "Ukjent",
        beskrivelse: "Kunne ikke hente grunndata",
        detaljer: "Feil ved oppslag mot NGU",
      } as NguGrunnResultat);
    }

    const text = await response.text();
    const resultat = parseGrunnResponse(text);

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot NGU Løsmasser" },
        { status: 504 }
      );
    }
    return NextResponse.json({
      jordart: "Ukjent",
      beskrivelse: "Feil ved oppslag",
      detaljer: "Kunne ikke koble til NGU",
    } as NguGrunnResultat);
  }
}
