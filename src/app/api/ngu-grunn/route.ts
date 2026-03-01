import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildWmsGetFeatureInfoUrl } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NguGrunnResultat } from "@/types";

const JORDART_PRAKTISK: Record<string, string> = {
  "hav- og fjordavsetning": "Leirerik grunn — kan kreve peling eller forsterket fundament",
  "marin avsetning": "Leirerik grunn — kan kreve peling eller forsterket fundament",
  "havavsetning": "Leirerik grunn — kan kreve peling eller forsterket fundament",
  "fjordavsetning": "Leirerik grunn — kan kreve peling eller forsterket fundament",
  "strandavsetning": "Sandholdig grunn — normalt gode grunnforhold",
  "elveavsetning": "Sand/grus fra elv — normalt gode grunnforhold, men sjekk flomfare",
  "breelvavsetning": "Sand/grus — normalt god bæreevne",
  "innsjøavsetning": "Finkornig grunn — kan ha begrenset bæreevne",
  "torv og myr": "Myk grunn — krever trolig masseutskifting",
  "torv": "Myk grunn — krever trolig masseutskifting",
  "myr": "Myk grunn — krever trolig masseutskifting",
  "morene": "Fast grunn — normalt enkel fundamentering",
  "morenemateriale": "Fast grunn — normalt enkel fundamentering",
  "tynn morene": "Tynt løsmassedekke over fjell — kan kreve tilpasning",
  "bart fjell": "Fjell i dagen — god bæreevne, kan kreve sprengning",
  "tynt løsmassedekke": "Tynt jordlag over fjell — god bæreevne, kan kreve sprengning",
  "forvitringsmateriale": "Forvitret fjell — variabel bæreevne, bør undersøkes nærmere",
  "fyllmasse": "Menneskeskapt oppfylling — usikker bæreevne, bør undersøkes",
  "skredmateriale": "Avsatt av skred — variabel kvalitet, bør undersøkes",
  "verdi ikke registrert": "Grunntype ikke kartlagt — bør undersøkes lokalt",
};

function praktiskBeskrivelse(jordart: string): string | null {
  const lower = jordart.toLowerCase();
  for (const [nøkkel, tekst] of Object.entries(JORDART_PRAKTISK)) {
    if (lower.includes(nøkkel)) return tekst;
  }
  return null;
}

function parseGrunnGml(text: string): NguGrunnResultat {
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
  const tekniskBeskrivelse = beskMatch ? beskMatch[1].trim() : jordart;
  const praktisk = praktiskBeskrivelse(jordart);
  const beskrivelse = praktisk || tekniskBeskrivelse;

  let detaljer = praktisk
    ? `${praktisk}. Teknisk: ${tekniskBeskrivelse}`
    : `Løsmassetype: ${tekniskBeskrivelse}`;
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
