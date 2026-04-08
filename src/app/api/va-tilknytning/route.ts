import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import type { VaTilknytningResultat } from "@/types";

/*
 * VA-tilknytning (vann og avløp) — heuristisk estimat.
 *
 * Det finnes ikke et samlet nasjonalt API for kommunalt VA-ledningsnett i Norge.
 * Hver kommune har sine egne data, og mange publiserer ikke ledningskart åpent.
 * Vi bruker derfor en transparent heuristikk basert på:
 *
 *   1. Avstand til nærmeste bygning (OSM Overpass) — god indikator på
 *      at et område er bebygd og dermed sannsynlig tilknyttet kommunalt VA.
 *   2. Avstand til nærmeste offentlige vei (NVDB) — kommunalt VA følger
 *      typisk offentlige veier.
 *
 * Vi er eksplisitt om at dette er en indikator, ikke et ledningskart.
 * Brukeren må alltid kontakte kommunens VA-avdeling for endelig svar.
 */

// Simple overpass query — find nearest building within 300m
async function hentNaermesteBygning(lat: number, lon: number): Promise<number | null> {
  try {
    const query = `
      [out:json][timeout:8];
      (
        way(around:300,${lat},${lon})["building"];
      );
      out center 10;
    `;
    const res = await fetchWithTimeout(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
      8000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const bygninger = data.elements || [];
    if (bygninger.length === 0) return null;

    let minAvstand = Infinity;
    for (const b of bygninger) {
      const bLat = b.center?.lat ?? b.lat;
      const bLon = b.center?.lon ?? b.lon;
      if (bLat == null || bLon == null) continue;
      const avstand = haversineMeter(lat, lon, bLat, bLon);
      if (avstand < minAvstand) minAvstand = avstand;
    }
    return minAvstand === Infinity ? null : Math.round(minAvstand);
  } catch {
    return null;
  }
}

function haversineMeter(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function tolkVaStatus(args: {
  avstandBygning: number | null;
  avstandVei: number | null;
}): VaTilknytningResultat {
  const { avstandBygning, avstandVei } = args;

  // All data missing — be honest
  if (avstandBygning == null && avstandVei == null) {
    return {
      status: "gra",
      estimertAvstand: null,
      forklaring:
        "Ingen data tilgjengelig for å estimere VA-tilknytning. Kontakt kommunens VA-avdeling for ledningskart og tilknytningsinformasjon.",
      kostnadIndikasjon: "Kan ikke estimeres uten data.",
      kilder: ["OSM Overpass", "NVDB"],
    };
  }

  // Coverage indicator: nearest building within 50m AND road within 50m
  // → very likely connected
  if (avstandBygning != null && avstandBygning <= 50 && avstandVei != null && avstandVei <= 50) {
    return {
      status: "gronn",
      estimertAvstand: Math.max(avstandBygning, avstandVei),
      forklaring: `Nabobebyggelse innen ${avstandBygning} m og offentlig vei innen ${avstandVei} m. Området er høyst sannsynlig tilknyttet kommunalt VA-nett.`,
      kostnadIndikasjon:
        "Typisk tilknytningskostnad for etablerte områder: 50 000 – 150 000 kr (kommunalt gebyr + fremlegging på egen tomt). Ring kommunens VA-avdeling for nøyaktig avgift.",
      kilder: ["OSM Overpass (nabobebyggelse)", "NVDB (vei)"],
    };
  }

  // Moderate: some indication of infrastructure nearby (50-200m)
  if (
    (avstandBygning != null && avstandBygning <= 200) ||
    (avstandVei != null && avstandVei <= 150)
  ) {
    const avstandTekst =
      avstandBygning != null
        ? `Nærmeste nabobebyggelse: ${avstandBygning} m${avstandVei != null ? `, offentlig vei: ${avstandVei} m` : ""}`
        : `Offentlig vei: ${avstandVei} m`;
    return {
      status: "gul",
      estimertAvstand:
        avstandBygning != null ? avstandBygning : avstandVei,
      forklaring: `${avstandTekst}. Kommunalt VA er mulig, men fremlegging kan kreve grøfter over lengre strekning. Dette er den dyreste ukjente kostnaden på tomten — avklar med kommunen før kjøpsbeslutning.`,
      kostnadIndikasjon:
        "Typisk mellom 150 000 og 400 000 kr avhengig av avstand, grunnforhold og om eksisterende stikkledning kan brukes. Grøfting i fjell øker kostnaden vesentlig. Innhent prisanslag fra kommunen og en lokal entreprenør.",
      kilder: ["OSM Overpass", "NVDB"],
    };
  }

  // Far: no nearby infrastructure — likely private solution needed
  return {
    status: "rod",
    estimertAvstand:
      avstandBygning != null && avstandVei != null
        ? Math.min(avstandBygning, avstandVei)
        : avstandBygning ?? avstandVei,
    forklaring:
      "Ingen nabobebyggelse eller offentlig vei i umiddelbar nærhet. Privat løsning (borehull + avløp/minirenseanlegg) er sannsynligvis nødvendig, eller VA må legges frem over lengre strekning.",
    kostnadIndikasjon:
      "Privat borehull for vann: typisk 80 000 – 200 000 kr avhengig av dybde til grunnvann. Minirenseanlegg for avløp: typisk 150 000 – 400 000 kr inkludert installasjon og godkjenning. Tallene er indikative — innhent tilbud fra lokale brønnborere og VA-entreprenører.",
    kilder: ["OSM Overpass", "NVDB"],
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

  // Fetch both in parallel
  const [bygningRes, veiRes] = await Promise.allSettled([
    hentNaermesteBygning(lat, lon),
    fetchWithTimeout(
      `https://nvdbapiles-v3.atlas.vegvesen.no/posisjon?lat=${lat}&lon=${lon}&maks_avstand=500&srid=4326`,
      { headers: { Accept: "application/vnd.vegvesen.nvdb-v3-rev1+json" } },
      6000
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  const avstandBygning = bygningRes.status === "fulfilled" ? bygningRes.value : null;
  let avstandVei: number | null = null;
  if (veiRes.status === "fulfilled" && veiRes.value) {
    const first = Array.isArray(veiRes.value) ? veiRes.value[0] : null;
    if (first?.avstand != null) avstandVei = Math.round(first.avstand);
  }

  const result = tolkVaStatus({ avstandBygning, avstandVei });
  return NextResponse.json(result);
}
