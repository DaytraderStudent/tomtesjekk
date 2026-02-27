import { API_TIMEOUT } from "./constants";

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildNveIdentifyParams(
  lat: number,
  lon: number,
  serviceUrl: string
): string {
  const extent = `${lon - 0.001},${lat - 0.001},${lon + 0.001},${lat + 0.001}`;
  const params = new URLSearchParams({
    f: "json",
    geometry: JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: "esriGeometryPoint",
    sr: "4326",
    layers: "all",
    tolerance: "10",
    mapExtent: extent,
    imageDisplay: "800,600,96",
    returnGeometry: "false",
  });
  return `${serviceUrl}?${params.toString()}`;
}

export function buildWmsGetFeatureInfoUrl(
  baseUrl: string,
  layers: string,
  lat: number,
  lon: number
): string {
  // WMS 1.3.0 with EPSG:4326 uses lat,lon order for BBOX
  const delta = 0.0001;
  const bbox = `${lat - delta},${lon - delta},${lat + delta},${lon + delta}`;

  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetFeatureInfo",
    LAYERS: layers,
    QUERY_LAYERS: layers,
    CRS: "EPSG:4326",
    BBOX: bbox,
    WIDTH: "101",
    HEIGHT: "101",
    I: "50",
    J: "50",
    INFO_FORMAT: "text/plain",
  });

  return `${baseUrl}?${params.toString()}`;
}

export function isValidUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
