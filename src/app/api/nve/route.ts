import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildNveIdentifyParams } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NveResultat } from "@/types";

async function identifyNve(serviceUrl: string, lat: number, lon: number) {
  const url = buildNveIdentifyParams(lat, lon, serviceUrl);
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  return response.json();
}

function parseFlom(data: any): NveResultat["flom"] {
  if (!data || !data.results || data.results.length === 0) {
    return { aktsomhetsomrade: false };
  }
  const result = data.results[0];
  const attrs = result.attributes || {};
  return {
    aktsomhetsomrade: true,
    faregrad: attrs.faregrad || attrs.Faregrad || attrs.FAREGRAD || undefined,
    detaljer: attrs.objektnavn || attrs.Objektnavn || result.layerName || "Flomaktsomhetsområde",
  };
}

function parseSkred(data: any): NveResultat["skred"] {
  if (!data || !data.results || data.results.length === 0) {
    return { aktsomhetsomrade: false };
  }
  const result = data.results[0];
  const attrs = result.attributes || {};
  return {
    aktsomhetsomrade: true,
    skredtype: attrs.skredtype || attrs.Skredtype || attrs.SKREDTYPE || undefined,
    detaljer: attrs.objektnavn || result.layerName || "Skredaktsomhetsområde",
  };
}

function parseKvikkleire(data: any): NveResultat["kvikkleire"] {
  if (!data || !data.results || data.results.length === 0) {
    return { faresone: false };
  }
  const result = data.results[0];
  const attrs = result.attributes || {};
  return {
    faresone: true,
    faregrad: attrs.faregrad || attrs.Faregrad || undefined,
    detaljer: attrs.objektnavn || result.layerName || "Kvikkleiresone",
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
    const [flomRes, skredRes, kvikkleireRes] = await Promise.allSettled([
      identifyNve(API_URLS.nveFlom, lat, lon),
      identifyNve(API_URLS.nveSkred, lat, lon),
      identifyNve(API_URLS.nveKvikkleire, lat, lon),
    ]);

    const resultat: NveResultat = {
      flom: parseFlom(flomRes.status === "fulfilled" ? flomRes.value : null),
      skred: parseSkred(skredRes.status === "fulfilled" ? skredRes.value : null),
      kvikkleire: parseKvikkleire(kvikkleireRes.status === "fulfilled" ? kvikkleireRes.value : null),
    };

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot NVE" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot NVE" },
      { status: 500 }
    );
  }
}
