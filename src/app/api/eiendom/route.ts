import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { EiendomResultat } from "@/types";

/**
 * Geodesic polygon area using the Shoelace formula on WGS84 coordinates.
 * Approximation: converts degrees to meters at the polygon's mean latitude.
 */
function geodesicArea(coords: number[][]): number {
  if (coords.length < 3) return 0;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const meanLat =
    coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos(toRad(meanLat));

  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const xi = coords[i][0] * mPerDegLon;
    const yi = coords[i][1] * mPerDegLat;
    const xj = coords[j][0] * mPerDegLon;
    const yj = coords[j][1] * mPerDegLat;
    area += xi * yj - xj * yi;
  }

  return Math.abs(area / 2);
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
    // Fetch cadastral info and boundary polygon in parallel
    const [punktRes, omraderRes] = await Promise.allSettled([
      fetchWithTimeout(
        `${API_URLS.eiendomPunkt}?nord=${lat}&ost=${lon}&koordsys=4258&radius=50`
      ).then((r) => r.json()),
      fetchWithTimeout(
        `${API_URLS.eiendomOmrader}?nord=${lat}&ost=${lon}&koordsys=4258&radius=100`,
        {},
        15000
      ).then((r) => r.json()),
    ]);

    // Parse cadastral data
    const punkt =
      punktRes.status === "fulfilled" ? punktRes.value : null;
    const eiendom = punkt?.eiendom?.[0] || punkt?.[0];

    if (!eiendom) {
      return NextResponse.json(
        { error: "Ingen eiendom funnet på dette punktet" },
        { status: 404 }
      );
    }

    // Parse GeoJSON boundary
    const omrader =
      omraderRes.status === "fulfilled" ? omraderRes.value : null;
    let grenseFeature: GeoJSON.Feature | null = null;
    let arealKvm: number | null = null;

    if (omrader?.features?.length > 0) {
      grenseFeature = omrader.features[0];

      // Calculate area from polygon coordinates
      const geom = grenseFeature?.geometry;
      if (geom && geom.type === "Polygon") {
        const ring = (geom as GeoJSON.Polygon).coordinates[0];
        arealKvm = geodesicArea(ring);
      } else if (geom && geom.type === "MultiPolygon") {
        const polygons = (geom as GeoJSON.MultiPolygon).coordinates;
        arealKvm = polygons.reduce(
          (sum, poly) => sum + geodesicArea(poly[0]),
          0
        );
      }
    }

    const resultat: EiendomResultat = {
      kommunenummer: eiendom.kommunenummer || "",
      gardsnummer: eiendom.gardsnummer || 0,
      bruksnummer: eiendom.bruksnummer || 0,
      matrikkelnummertekst:
        eiendom.matrikkelnummertekst ||
        `${eiendom.kommunenummer}-${eiendom.gardsnummer}/${eiendom.bruksnummer}`,
      arealKvm: arealKvm ? Math.round(arealKvm) : null,
      grenseGeoJson: grenseFeature,
    };

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot Geonorge Eiendom" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot Geonorge Eiendom" },
      { status: 500 }
    );
  }
}
