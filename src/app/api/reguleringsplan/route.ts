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

// --- BYA/height parsing from WMS feature properties ---

interface UtnyttelseData {
  utnyttingsgrad: number | null;
  maksHoyde: number | null;
  maksEtasjer: number | null;
}

const BYA_PATTERNS = /^(utnyttingsgrad|bya|bebygd_areal|%-bya|prosent_bya|utnytting)/i;
const HOYDE_PATTERNS = /^(maks_hoyde|makshøyde|makshoyde|byggehoyde|byggehøyde|max_height|gesimsh)/i;
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

function parseJsonFeatures(data: any): ReguleringsplanResultat | null {
  if (!data?.features || data.features.length === 0) {
    return null;
  }

  const props = data.features[0].properties || {};

  // DiBK WMS field names (may vary)
  const planNavn =
    props.plannavn || props.planNavn || props.PLANNAVN || null;
  const planType =
    props.plantype || props.planType || props.PLANTYPE || null;
  const arealformaal =
    props.arealformaal || props.arealformål || props.AREALFORMAAL ||
    props.formaal || props.FORMAAL || null;
  const planStatus =
    props.planstatus || props.planStatus || props.PLANSTATUS || null;
  const planId =
    props.planid || props.planId || props.PLANID ||
    props.nasjonalarealplanid || props.nasjonalArealplanId || null;

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

  if (/frittliggende/.test(lower) || /enebolig/.test(lower)) {
    return { utnyttingsgrad: 25, maksHoyde: 8, maksEtasjer: 2, kilde: "tek17" };
  }
  if (/konsentrert/.test(lower) || /rekkehus/.test(lower) || /tomannsbolig/.test(lower)) {
    return { utnyttingsgrad: 35, maksHoyde: 9, maksEtasjer: 3, kilde: "tek17" };
  }
  if (/bolig/.test(lower)) {
    return { utnyttingsgrad: 30, maksHoyde: 9, maksEtasjer: 3, kilde: "tek17" };
  }
  if (/sentrum/.test(lower) || /blandet/.test(lower) || /forretning/.test(lower)) {
    return { utnyttingsgrad: 50, maksHoyde: 15, maksEtasjer: 5, kilde: "tek17" };
  }
  if (/næring/.test(lower) || /industri/.test(lower) || /lager/.test(lower)) {
    return { utnyttingsgrad: 60, maksHoyde: 12, maksEtasjer: 4, kilde: "tek17" };
  }
  if (/fritid/.test(lower) || /hytte/.test(lower)) {
    return { utnyttingsgrad: 15, maksHoyde: 6, maksEtasjer: 2, kilde: "tek17" };
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

  // Fallback: try kommuneplan
  const kpResult = await queryWms(
    DIBK_WMS_KP,
    "kpomrade,arealformal_kp",
    lat,
    lon
  );

  if (kpResult?.harPlan) {
    // Apply TEK17 reference for kommuneplan (rarely has BYA data)
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
