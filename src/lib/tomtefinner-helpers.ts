import { fetchWithTimeout } from "./api-helpers";

// Map building types to SOSI arealformaal search terms
export const BYGNINGSTYPE_TIL_FORMAAL: Record<string, string[]> = {
  enebolig: ["Boligbebyggelse", "frittliggende", "småhus"],
  rekkehus: ["Boligbebyggelse", "konsentrert", "småhus"],
  blokk: ["Boligbebyggelse", "blokkbebyggelse"],
  naering: ["Næringsbebyggelse", "Sentrumsformål", "tjenesteyting"],
  hytte: ["Fritidsbebyggelse", "turistformål"],
  annet: ["Bebyggelse og anlegg"],
};

// Get municipality bounding box from Kartverket
export async function hentKommuneBbox(
  kommunenummer: string
): Promise<{ minLat: number; minLon: number; maxLat: number; maxLon: number } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://ws.geonorge.no/kommuneinfo/v1/kommuner/${kommunenummer}`,
      {},
      8000
    );
    if (!res.ok) return null;
    const data = await res.json();

    if (data.avgrensningsboks) {
      const coords = data.avgrensningsboks.coordinates?.[0];
      if (coords && coords.length >= 4) {
        const lons = coords.map((c: number[]) => c[0]);
        const lats = coords.map((c: number[]) => c[1]);
        return {
          minLon: Math.min(...lons),
          maxLon: Math.max(...lons),
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Generate a grid of sample points within a bounding box
export function genererRutenett(
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number },
  antallPunkter: number = 36
): { lat: number; lon: number }[] {
  const sideLength = Math.ceil(Math.sqrt(antallPunkter));
  const latStep = (bbox.maxLat - bbox.minLat) / (sideLength + 1);
  const lonStep = (bbox.maxLon - bbox.minLon) / (sideLength + 1);
  const punkter: { lat: number; lon: number }[] = [];

  for (let i = 1; i <= sideLength; i++) {
    for (let j = 1; j <= sideLength; j++) {
      punkter.push({
        lat: bbox.minLat + latStep * i,
        lon: bbox.minLon + lonStep * j,
      });
    }
  }
  return punkter;
}

// Reverse geocode a coordinate to nearest address
export async function hentNaermesteAdresse(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const res = await fetchWithTimeout(
      `https://ws.geonorge.no/adresser/v1/punktsok?lat=${lat}&lon=${lon}&radius=500&treffPerSide=1`,
      {},
      5000
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const data = await res.json();
    if (data.adresser?.[0]?.adressetekst) {
      return data.adresser[0].adressetekst;
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

// Check zoning at a point using DiBK WMS
export async function sjekkRegulering(
  lat: number,
  lon: number
): Promise<{ harPlan: boolean; arealformaal: string | null; planNavn: string | null } | null> {
  try {
    const res = await fetchWithTimeout(
      `/api/reguleringsplan?lat=${lat}&lon=${lon}`,
      {},
      8000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      harPlan: data.harPlan === true,
      arealformaal: data.arealformaal || null,
      planNavn: data.planNavn || null,
    };
  } catch {
    return null;
  }
}
