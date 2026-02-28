import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildWmsGetFeatureInfoUrl } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NguGrunnResultat } from "@/types";

function parseGrunnGml(text: string): NguGrunnResultat {
  // GML response contains fields like:
  // <losmassetypeNavn>Forvitringsmateriale</losmassetypeNavn>
  // <losmassetypeBesk>Forvitringsmateriale, ikke inndelt etter mektighet</losmassetypeBesk>

  if (text.includes("Search returned no results") || (!text.includes("massetype") && !text.includes("Losmasse") && !text.includes("LøsmasseFlate"))) {
    return {
      jordart: "Ukjent",
      beskrivelse: "Ingen løsmassedata for dette området",
      detaljer: "Ingen data funnet i NGU løsmassedatabasen",
    };
  }

  // Field names may use ø (løsmassetype) or o (losmassetype)
  const navnMatch = text.match(/<l[oø]smassetypeNavn>([^<]+)<\/l[oø]smassetypeNavn>/);
  const beskMatch = text.match(/<l[oø]smassetypeBesk>([^<]+)<\/l[oø]smassetypeBesk>/);
  const infiltrasjonMatch = text.match(/<infiltrasjonPotensialNavn>([^<]+)<\/infiltrasjonPotensialNavn>/);
  const grunnvannMatch = text.match(/<grunnvannPotensialNavn>([^<]+)<\/grunnvannPotensialNavn>/);

  const jordart = navnMatch ? navnMatch[1].trim() : "Ukjent";
  const beskrivelse = beskMatch ? beskMatch[1].trim() : jordart;

  let detaljer = `Løsmassetype: ${beskrivelse}`;
  if (infiltrasjonMatch) {
    detaljer += `. Infiltrasjon: ${infiltrasjonMatch[1].trim()}`;
  }
  if (grunnvannMatch) {
    detaljer += `. Grunnvannpotensial: ${grunnvannMatch[1].trim()}`;
  }

  return { jordart, beskrivelse, detaljer };
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
      "Losmasser_temakart_sammenstilt",
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
    const resultat = parseGrunnGml(text);

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
