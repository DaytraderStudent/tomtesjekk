import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { StoyResultat } from "@/types";

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
    const d = 0.0005; // ~50m bbox around point
    const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;

    const params = new URLSearchParams({
      service: "WMS",
      request: "GetFeatureInfo",
      version: "1.1.1",
      layers: "Strategiskstoykart_lden",
      query_layers: "Strategiskstoykart_lden",
      srs: "EPSG:4326",
      bbox,
      width: "256",
      height: "256",
      x: "128",
      y: "128",
      info_format: "application/json",
    });

    const url = `${API_URLS.stoyVegvesen}?${params.toString()}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return NextResponse.json({
        harStoy: false,
        nivaDb: null,
        enhet: "LDEN",
        kilde: "Veitrafikk",
        detaljer: "Kunne ikke hente støydata fra Statens vegvesen.",
      } as StoyResultat);
    }

    const data = await response.json();
    const features = data?.features;

    if (!features || features.length === 0) {
      return NextResponse.json({
        harStoy: false,
        nivaDb: null,
        enhet: "LDEN",
        kilde: "Veitrafikk",
        detaljer: "Ingen registrert veitrafikkstøy over 55 dB (LDEN) på denne lokasjonen.",
      } as StoyResultat);
    }

    const props = features[0].properties || {};
    const nivaDb = parseInt(props["STØYINTERVALL"] || props["Støyintervall"] || props["stoyintervall"] || "0", 10) || null;

    const kontekst: Record<number, string> = {
      55: "Svak bakgrunnsstøy fra veitrafikk. Generelt akseptabelt for bolig.",
      60: "Merkbar veitrafikkstøy. Kan oppleves forstyrrende utendørs. Vurder støyskjerming.",
      65: "Betydelig veitrafikkstøy. Støyisolering anbefales for nye boliger.",
      70: "Høy veitrafikkstøy. Krav om støytiltak ved boligbygging. Utendørs oppholdsareal bør skjermes.",
      75: "Svært høy veitrafikkstøy. Normalt ikke anbefalt for boligformål uten omfattende tiltak.",
    };

    const detaljerTekst = nivaDb
      ? `Registrert støynivå: ${nivaDb} dB (LDEN) fra veitrafikk. ${kontekst[nivaDb] || "Vurder støyforhold ved byggesøknad."}`
      : "Støydata tilgjengelig men nivå ukjent.";

    return NextResponse.json({
      harStoy: true,
      nivaDb,
      enhet: "LDEN",
      kilde: "Veitrafikk",
      detaljer: detaljerTekst,
    } as StoyResultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot Statens vegvesen støytjeneste" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot støytjeneste" },
      { status: 500 }
    );
  }
}
