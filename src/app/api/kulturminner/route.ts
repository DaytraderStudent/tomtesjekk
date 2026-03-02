import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { KulturminneResultat } from "@/types";

const BASE = API_URLS.kulturminner;

// Layers: 6 = Enkeltminner, 7 = Lokaliteter, 1 = FredaBygninger
const LAYERS = [6, 7, 1] as const;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildQueryUrl(layer: number, lat: number, lon: number): string {
  const params = new URLSearchParams({
    f: "json",
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    distance: "200",
    units: "esriSRUnit_Meter",
    inSR: "4326",
    outSR: "4326",
    outFields: "navn,kulturminneKategori,vernetype,vernelov,linkKulturminnesok,lokalId,kommunenr",
    returnGeometry: "true",
    resultRecordCount: "20",
  });
  return `${BASE}/${layer}/query?${params.toString()}`;
}

function centroid(geometry: any): { lat: number; lon: number } | null {
  if (geometry?.x != null && geometry?.y != null) {
    return { lat: geometry.y, lon: geometry.x };
  }
  if (geometry?.rings) {
    let sumX = 0, sumY = 0, count = 0;
    for (const ring of geometry.rings) {
      for (const [x, y] of ring) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
    if (count > 0) return { lat: sumY / count, lon: sumX / count };
  }
  if (geometry?.paths) {
    let sumX = 0, sumY = 0, count = 0;
    for (const path of geometry.paths) {
      for (const [x, y] of path) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
    if (count > 0) return { lat: sumY / count, lon: sumX / count };
  }
  return null;
}

function erFredet(vernetype: string): boolean {
  const v = vernetype.toLowerCase();
  return v.includes("fredet") || v.includes("fredning");
}

interface RawMinne {
  navn: string;
  kategori: string;
  vernetype: string;
  avstandMeter: number;
  lenke: string | null;
  dedupKey: string;
}

function parseFeatures(
  data: any,
  lat: number,
  lon: number
): RawMinne[] {
  if (!data?.features || !Array.isArray(data.features)) return [];

  return data.features.map((f: any) => {
    const a = f.attributes || {};
    const navn = a.navn || a.Navn || "Ukjent";
    const kategori = a.kulturminneKategori || a.KulturminneKategori || "";
    const vernetype = a.vernetype || a.Vernetype || "";
    const lenke = a.linkKulturminnesok || a.LinkKulturminnesok || null;
    const lokalId = a.lokalId || a.LokalId || "";
    const kommunenr = a.kommunenr || a.Kommunenr || "";

    const c = centroid(f.geometry);
    const avstandMeter = c
      ? haversineMeters(lat, lon, c.lat, c.lon)
      : 200;

    const dedupKey = lokalId || `${navn}__${kommunenr}`;

    return { navn, kategori, vernetype, avstandMeter, lenke, dedupKey };
  });
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
    const urls = LAYERS.map((l) => buildQueryUrl(l, lat, lon));
    const responses = await Promise.allSettled(
      urls.map((url) => fetchWithTimeout(url).then((r) => r.json()))
    );

    const allMinner: RawMinne[] = [];
    for (const res of responses) {
      if (res.status === "fulfilled") {
        allMinner.push(...parseFeatures(res.value, lat, lon));
      }
    }

    // Deduplicate by dedupKey
    const seen = new Set<string>();
    const unike: RawMinne[] = [];
    for (const m of allMinner) {
      if (!seen.has(m.dedupKey)) {
        seen.add(m.dedupKey);
        unike.push(m);
      }
    }

    // Sort by distance, max 10
    unike.sort((a, b) => a.avstandMeter - b.avstandMeter);
    const topp = unike.slice(0, 10);

    const harFredning = topp.some((m) => erFredet(m.vernetype));
    const naermesteAvstandMeter = topp.length > 0
      ? Math.round(topp[0].avstandMeter)
      : null;

    const resultat: KulturminneResultat = {
      harKulturminner: topp.length > 0,
      minner: topp.map((m) => ({
        navn: m.navn,
        kategori: m.kategori,
        vernetype: m.vernetype,
        avstandMeter: Math.round(m.avstandMeter),
        lenke: m.lenke,
      })),
      naermesteAvstandMeter,
      harFredning,
    };

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot Riksantikvaren" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot Riksantikvaren" },
      { status: 500 }
    );
  }
}
