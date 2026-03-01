import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import type { ReguleringsplanResultat } from "@/types";

const DIBK_WMS_REG = "https://nap.ft.dibk.no/services/wms/reguleringsplaner/";
const DIBK_WMS_KP = "https://nap.ft.dibk.no/services/wms/kommuneplaner/";

function toEpsg3857(lat: number, lon: number): { x: number; y: number } {
  const x = (lon * 20037508.34) / 180;
  const latRad = (lat * Math.PI) / 180;
  const y = (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * 20037508.34) / Math.PI;
  return { x, y };
}

function buildDibkGetFeatureInfoUrl(
  baseUrl: string,
  layers: string,
  lat: number,
  lon: number
): string {
  const { x, y } = toEpsg3857(lat, lon);
  const delta = 200; // ~200m around point
  const bbox = `${x - delta},${y - delta},${x + delta},${y + delta}`;

  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.1.1",
    REQUEST: "GetFeatureInfo",
    LAYERS: layers,
    QUERY_LAYERS: layers,
    SRS: "EPSG:3857",
    BBOX: bbox,
    WIDTH: "256",
    HEIGHT: "256",
    X: "128",
    Y: "128",
    INFO_FORMAT: "application/json",
    FEATURE_COUNT: "5",
  });

  return `${baseUrl}?${params.toString()}`;
}

const FALLBACK_RESULT: ReguleringsplanResultat = {
  harPlan: null,
  planNavn: null,
  planType: null,
  arealformaal: null,
  planStatus: null,
  planId: null,
  detaljer:
    "Reguleringsplandata er for tiden utilgjengelig nasjonalt. " +
    "Kontakt kommunen eller sjekk kommunens planinnsyn for gjeldende reguleringsplan.",
};

// --- SOSI arealformål code mapping ---

const SOSI_AREALFORMAAL: Record<string, string> = {
  "1": "Bebyggelse og anlegg",
  "1001": "Bebyggelse og anlegg",
  "1100": "Boligbebyggelse",
  "1110": "Boligbebyggelse – frittliggende småhusbebyggelse",
  "1120": "Boligbebyggelse – konsentrert småhusbebyggelse",
  "1130": "Boligbebyggelse – blokkbebyggelse",
  "1140": "Næringsbebyggelse",
  "1150": "Fritidsbebyggelse",
  "1160": "Sentrumsformål",
  "1170": "Offentlig eller privat tjenesteyting",
  "1300": "Fritids- og turistformål",
  "2": "Samferdselsanlegg og teknisk infrastruktur",
  "2010": "Veg",
  "2020": "Bane",
  "2030": "Lufthavn",
  "2040": "Havn",
  "2080": "Samferdselsanlegg",
  "2081": "Kjøreveg",
  "2082": "Gang- og sykkelveg",
  "2083": "Annen veggrunn",
  "3": "Grønnstruktur",
  "3001": "Grønnstruktur",
  "4": "Forsvaret",
  "5": "Landbruks-, natur- og friluftsformål",
  "5100": "Landbruk",
  "5200": "Naturformål",
  "5300": "Friluftsformål",
  "6": "Bruk og vern av sjø og vassdrag",
};

function resolveArealformaal(val: string | null): string | null {
  if (!val) return null;
  // If it looks like a SOSI code, map it; otherwise return as-is
  if (/^\d+$/.test(val.trim())) {
    return SOSI_AREALFORMAAL[val.trim()] || `Arealformaal (kode ${val.trim()})`;
  }
  return val;
}

// --- BYA/height parsing from WMS feature properties ---

interface UtnyttelseData {
  utnyttingsgrad: number | null;
  maksHoyde: number | null;
  maksEtasjer: number | null;
}

// DiBK WMS often double-encodes UTF-8, so "å" → "Ã¥", "ø" → "Ã¸" etc.
// Match both correct and mangled forms
const BYA_PATTERNS = /^(utnyttingsgrad|utnytting\.utnyttingstall|bya|bebygd_areal|%-bya|prosent_bya)/i;
const HOYDE_PATTERNS = /^(maks_hoyde|maksh.yde|byggehoyde|byggeh.yde|max_height|gesimsh)/i;
const ETASJE_PATTERNS = /^(maks_etasjer|maksetasjer|antall_etasjer|etasjer|max_etasjer)/i;

function parseNumeric(val: unknown): number | null {
  if (val == null) return null;
  const s = String(val).replace(",", ".").replace(/[%m]/g, "").trim();
  const n = parseFloat(s);
  return isFinite(n) && n > 0 ? n : null;
}

function parseUtnyttelse(features: any[]): UtnyttelseData {
  let utnyttingsgrad: number | null = null;
  let maksHoyde: number | null = null;
  let maksEtasjer: number | null = null;

  for (const feature of features) {
    const props = feature.properties || {};
    for (const [key, val] of Object.entries(props)) {
      if (!utnyttingsgrad && BYA_PATTERNS.test(key)) {
        utnyttingsgrad = parseNumeric(val);
      }
      if (!maksHoyde && HOYDE_PATTERNS.test(key)) {
        maksHoyde = parseNumeric(val);
      }
      if (!maksEtasjer && ETASJE_PATTERNS.test(key)) {
        maksEtasjer = parseNumeric(val);
      }
    }
  }

  return { utnyttingsgrad, maksHoyde, maksEtasjer };
}

// Find a property value by trying multiple key variants (handles double-encoded UTF-8)
function findProp(props: Record<string, any>, ...keys: string[]): string | null {
  for (const key of keys) {
    if (props[key] != null && props[key] !== "") return String(props[key]);
  }
  // Also scan all keys for partial matches (handles Ã¥ → å etc.)
  const propKeys = Object.keys(props);
  for (const key of keys) {
    const lower = key.toLowerCase();
    const found = propKeys.find((k) => k.toLowerCase().includes(lower));
    if (found && props[found] != null && props[found] !== "") return String(props[found]);
  }
  return null;
}

function parseJsonFeatures(data: any): ReguleringsplanResultat | null {
  if (!data?.features || data.features.length === 0) {
    return null;
  }

  // Scan ALL features for plan info (rpomrade + arealformal may be separate features)
  let planNavn: string | null = null;
  let planType: string | null = null;
  let rawArealformaal: string | null = null;
  let planStatus: string | null = null;
  let planId: string | null = null;

  for (const feature of data.features) {
    const props = feature.properties || {};
    if (!planNavn) planNavn = findProp(props, "plannavn", "planNavn", "PLANNAVN");
    if (!planType) planType = findProp(props, "plantype", "planType", "PLANTYPE");
    if (!rawArealformaal) rawArealformaal = findProp(props, "arealformaal", "arealformål", "AREALFORMAAL", "formaal", "FORMAAL");
    if (!planStatus) planStatus = findProp(props, "planstatus", "planStatus", "PLANSTATUS");
    if (!planId) planId = findProp(props, "planid", "planId", "PLANID", "nasjonalarealplanid", "nasjonalArealplanId", "planidentifikasjon");
  }

  // Resolve SOSI codes to readable names
  const arealformaal = resolveArealformaal(rawArealformaal);

  // Parse BYA/height from all features
  const utnyttelse = parseUtnyttelse(data.features);

  let detaljer = "";
  if (planNavn) detaljer += `Plan: ${planNavn}`;
  if (planType) detaljer += detaljer ? `. Type: ${planType}` : `Type: ${planType}`;
  if (arealformaal) detaljer += detaljer ? `. Formål: ${arealformaal}` : `Formål: ${arealformaal}`;
  if (planStatus) detaljer += detaljer ? `. Status: ${planStatus}` : `Status: ${planStatus}`;

  return {
    harPlan: true,
    planNavn,
    planType,
    arealformaal,
    planStatus,
    planId,
    detaljer: detaljer || "Reguleringsplan funnet",
    utnyttingsgrad: utnyttelse.utnyttingsgrad,
    maksHoyde: utnyttelse.maksHoyde,
    maksEtasjer: utnyttelse.maksEtasjer,
    utnyttelseKilde: utnyttelse.utnyttingsgrad || utnyttelse.maksHoyde || utnyttelse.maksEtasjer
      ? "plan"
      : undefined,
  };
}

// --- Bestemmelser layer query for BYA data ---

async function queryBestemmelserWms(
  lat: number,
  lon: number
): Promise<UtnyttelseData> {
  try {
    const url = buildDibkGetFeatureInfoUrl(
      DIBK_WMS_REG,
      "rpbestemmelser_vn1",
      lat,
      lon
    );
    const response = await fetchWithTimeout(url);
    if (!response.ok) return { utnyttingsgrad: null, maksHoyde: null, maksEtasjer: null };

    const data = await response.json();
    if (!data?.features || data.features.length === 0) {
      return { utnyttingsgrad: null, maksHoyde: null, maksEtasjer: null };
    }

    return parseUtnyttelse(data.features);
  } catch {
    return { utnyttingsgrad: null, maksHoyde: null, maksEtasjer: null };
  }
}

// --- TEK17 reference values based on arealformål ---

function tek17Referanse(arealformaal: string | null): UtnyttelseData & { kilde: "tek17" } | null {
  if (!arealformaal) return null;

  const lower = arealformaal.toLowerCase();

  if (/frittliggende/.test(lower) || /enebolig/.test(lower) || /småhus/.test(lower)) {
    return { utnyttingsgrad: 25, maksHoyde: 8, maksEtasjer: 2, kilde: "tek17" };
  }
  if (/konsentrert/.test(lower) || /rekkehus/.test(lower) || /tomannsbolig/.test(lower)) {
    return { utnyttingsgrad: 35, maksHoyde: 9, maksEtasjer: 3, kilde: "tek17" };
  }
  if (/blokk/.test(lower)) {
    return { utnyttingsgrad: 50, maksHoyde: 15, maksEtasjer: 5, kilde: "tek17" };
  }
  if (/bolig/.test(lower)) {
    return { utnyttingsgrad: 30, maksHoyde: 9, maksEtasjer: 3, kilde: "tek17" };
  }
  if (/sentrum/.test(lower) || /blandet/.test(lower) || /forretning/.test(lower) || /tjenesteyting/.test(lower)) {
    return { utnyttingsgrad: 50, maksHoyde: 15, maksEtasjer: 5, kilde: "tek17" };
  }
  if (/næring/.test(lower) || /industri/.test(lower) || /lager/.test(lower)) {
    return { utnyttingsgrad: 60, maksHoyde: 12, maksEtasjer: 4, kilde: "tek17" };
  }
  if (/fritid/.test(lower) || /hytte/.test(lower) || /turistform/.test(lower)) {
    return { utnyttingsgrad: 15, maksHoyde: 6, maksEtasjer: 2, kilde: "tek17" };
  }
  if (/bebyggelse og anlegg/.test(lower)) {
    return { utnyttingsgrad: 30, maksHoyde: 9, maksEtasjer: 3, kilde: "tek17" };
  }

  // Unknown formål — don't return misleading values
  return null;
}

// ---

async function queryWms(
  baseUrl: string,
  layers: string,
  lat: number,
  lon: number
): Promise<ReguleringsplanResultat | null> {
  try {
    const url = buildDibkGetFeatureInfoUrl(baseUrl, layers, lat, lon);
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    return parseJsonFeatures(data);
  } catch {
    return null;
  }
}

function harUtnyttelseData(result: ReguleringsplanResultat): boolean {
  return !!(result.utnyttingsgrad || result.maksHoyde || result.maksEtasjer);
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

  // Try reguleringsplaner (detail + area plans)
  const regResult = await queryWms(
    DIBK_WMS_REG,
    "rpomrade_vn1,arealformal_vn1",
    lat,
    lon
  );

  if (regResult?.harPlan) {
    // If no BYA data from rpomrade, try bestemmelser layer
    if (!harUtnyttelseData(regResult)) {
      const bestemmelser = await queryBestemmelserWms(lat, lon);
      if (bestemmelser.utnyttingsgrad || bestemmelser.maksHoyde || bestemmelser.maksEtasjer) {
        regResult.utnyttingsgrad = bestemmelser.utnyttingsgrad;
        regResult.maksHoyde = bestemmelser.maksHoyde;
        regResult.maksEtasjer = bestemmelser.maksEtasjer;
        regResult.utnyttelseKilde = "plan";
      }
    }

    // If still no BYA data, apply TEK17 reference
    if (!harUtnyttelseData(regResult)) {
      const tek = tek17Referanse(regResult.arealformaal);
      if (tek) {
        regResult.utnyttingsgrad = tek.utnyttingsgrad;
        regResult.maksHoyde = tek.maksHoyde;
        regResult.maksEtasjer = tek.maksEtasjer;
        regResult.utnyttelseKilde = "tek17";
      }
    }

    return NextResponse.json(regResult);
  }

  // Fallback: try kommuneplan (query omrade + arealformal separately to get arealformål)
  const [kpResult, kpArealResult] = await Promise.all([
    queryWms(DIBK_WMS_KP, "kpomrade", lat, lon),
    queryWms(DIBK_WMS_KP, "arealformal_kp", lat, lon),
  ]);

  // Merge arealformål from separate layer if main query didn't have it
  if (kpResult?.harPlan) {
    if (!kpResult.arealformaal && kpArealResult?.arealformaal) {
      kpResult.arealformaal = kpArealResult.arealformaal;
      // Rebuild detaljer with new arealformål
      let detaljer = "";
      if (kpResult.planNavn) detaljer += `Plan: ${kpResult.planNavn}`;
      if (kpResult.planType) detaljer += detaljer ? `. Type: ${kpResult.planType}` : `Type: ${kpResult.planType}`;
      detaljer += detaljer ? `. Formål: ${kpResult.arealformaal}` : `Formål: ${kpResult.arealformaal}`;
      if (kpResult.planStatus) detaljer += `. Status: ${kpResult.planStatus}`;
      kpResult.detaljer = detaljer;
    }

    // Merge any BYA data from arealformål layer
    if (!harUtnyttelseData(kpResult) && kpArealResult && harUtnyttelseData(kpArealResult)) {
      kpResult.utnyttingsgrad = kpArealResult.utnyttingsgrad;
      kpResult.maksHoyde = kpArealResult.maksHoyde;
      kpResult.maksEtasjer = kpArealResult.maksEtasjer;
      kpResult.utnyttelseKilde = "plan";
    }

    // Apply TEK17 reference if still no BYA data
    if (!harUtnyttelseData(kpResult)) {
      const tek = tek17Referanse(kpResult.arealformaal);
      if (tek) {
        kpResult.utnyttingsgrad = tek.utnyttingsgrad;
        kpResult.maksHoyde = tek.maksHoyde;
        kpResult.maksEtasjer = tek.maksEtasjer;
        kpResult.utnyttelseKilde = "tek17";
      }
    }

    return NextResponse.json(kpResult);
  }

  // Neither service returned features — service data not yet available
  return NextResponse.json(FALLBACK_RESULT);
}
