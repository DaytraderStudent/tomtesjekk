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

function parseJsonFeatures(data: any): ReguleringsplanResultat {
  if (!data?.features || data.features.length === 0) {
    return {
      harPlan: false,
      planNavn: null,
      planType: null,
      arealformaal: null,
      planStatus: null,
      planId: null,
      detaljer: "Ingen reguleringsplan funnet for dette punktet",
    };
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
  };
}

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
    const result = parseJsonFeatures(data);
    if (result.harPlan) return result;
    return result; // might be harPlan: false — let caller decide
  } catch {
    return null;
  }
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
    return NextResponse.json(kpResult);
  }

  // If we got explicit "no plan" from at least one successful query, report that
  if (regResult?.harPlan === false || kpResult?.harPlan === false) {
    return NextResponse.json(regResult || kpResult);
  }

  // Both queries failed — service unavailable
  return NextResponse.json(FALLBACK_RESULT);
}
