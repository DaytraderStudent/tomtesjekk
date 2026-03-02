import type L from "leaflet";
import { KARTLAG_MAP, KATEGORI_KARTLAG, type KartlagConfig } from "./kartlag";

interface CaptureOptions {
  grense?: GeoJSON.Feature | null;
  kartlag?: KartlagConfig[];
}

/**
 * Captures the current Leaflet map view as a PNG data-URL by drawing
 * OSM tiles + WMS overlays + polygon + marker directly onto a canvas.
 */
export async function taKartbilde(
  map: L.Map,
  _container: HTMLDivElement,
  opts?: CaptureOptions
): Promise<string | null> {
  try {
    const size = map.getSize();
    const zoom = Math.round(map.getZoom());
    const grense = opts?.grense;
    const kartlag = opts?.kartlag ?? [];

    // Canvas dimensions (2x for retina sharpness)
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = size.x * scale;
    canvas.height = size.y * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(scale, scale);

    // --- 1. Draw OSM base tiles ---
    await drawOsmTiles(ctx, map, zoom);

    // --- 2. Draw WMS overlays ---
    for (const lag of kartlag) {
      if (zoom >= lag.minZoom) {
        await drawWmsOverlay(ctx, map, {
          baseUrl: lag.baseUrl,
          layers: lag.layers,
          opacity: lag.opacity,
        });
      }
    }

    // --- 3. Draw property boundary polygon ---
    drawPolygon(ctx, map, grense);

    // --- 4. Draw marker pin ---
    drawMarkerOnCanvas(ctx, map);

    // --- 5. Attribution ---
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText("\u00A9 OpenStreetMap", size.x - 110, size.y - 6);

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Kartfangst feilet:", e);
    return null;
  }
}

/**
 * Batch-captures map images: one base image + one per analysis category.
 * Caches the base canvas (OSM + polygon + marker) and only re-draws WMS overlays
 * for each category, saving significant time.
 *
 * Returns Record<string, string> where keys are category IDs and "base" for the overview.
 */
export async function taKartbilderBatch(
  map: L.Map,
  _container: HTMLDivElement,
  grense: GeoJSON.Feature | null,
  kategoriIder: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  try {
    const size = map.getSize();
    const zoom = Math.round(map.getZoom());
    const scale = 1.5; // Lower scale for category images (saves size)

    // --- Build base canvas (OSM + polygon + marker) ---
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = size.x * scale;
    baseCanvas.height = size.y * scale;
    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) return result;
    baseCtx.scale(scale, scale);

    await drawOsmTiles(baseCtx, map, zoom);
    drawPolygon(baseCtx, map, grense);
    drawMarkerOnCanvas(baseCtx, map);

    // Attribution
    baseCtx.font = "10px sans-serif";
    baseCtx.fillStyle = "rgba(0,0,0,0.5)";
    baseCtx.fillText("\u00A9 OpenStreetMap", size.x - 110, size.y - 6);

    // Cache base as ImageData
    const baseImageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);

    // Base image (with stoy + matrikkel overlays for the overview)
    const overviewCanvas = document.createElement("canvas");
    overviewCanvas.width = baseCanvas.width;
    overviewCanvas.height = baseCanvas.height;
    const overviewCtx = overviewCanvas.getContext("2d");
    if (overviewCtx) {
      overviewCtx.putImageData(baseImageData, 0, 0);
      overviewCtx.scale(scale, scale);
      // Draw stoy overlay on overview if zoom allows
      const stoyLag = KARTLAG_MAP["stoy"];
      if (zoom >= stoyLag.minZoom) {
        await drawWmsOverlay(overviewCtx, map, {
          baseUrl: stoyLag.baseUrl,
          layers: stoyLag.layers,
          opacity: stoyLag.opacity,
        });
      }
      // Draw matrikkel on overview if zoom allows
      const matrikkelLag = KARTLAG_MAP["matrikkel"];
      if (zoom >= matrikkelLag.minZoom) {
        await drawWmsOverlay(overviewCtx, map, {
          baseUrl: matrikkelLag.baseUrl,
          layers: matrikkelLag.layers,
          opacity: matrikkelLag.opacity,
        });
      }
      result["base"] = overviewCanvas.toDataURL("image/jpeg", 0.7);
    }

    // --- Per-category captures ---
    for (const katId of kategoriIder) {
      const kartlagIder = KATEGORI_KARTLAG[katId];
      if (!kartlagIder || kartlagIder.length === 0) continue;

      const catCanvas = document.createElement("canvas");
      catCanvas.width = baseCanvas.width;
      catCanvas.height = baseCanvas.height;
      const catCtx = catCanvas.getContext("2d");
      if (!catCtx) continue;

      catCtx.putImageData(baseImageData, 0, 0);
      catCtx.scale(scale, scale);

      for (const lagId of kartlagIder) {
        const lag = KARTLAG_MAP[lagId];
        if (!lag || zoom < lag.minZoom) continue;
        await drawWmsOverlay(catCtx, map, {
          baseUrl: lag.baseUrl,
          layers: lag.layers,
          opacity: lag.opacity,
        });
      }

      result[katId] = catCanvas.toDataURL("image/jpeg", 0.7);
    }
  } catch (e) {
    console.error("Batch kartfangst feilet:", e);
  }

  return result;
}

// --- Shared drawing helpers ---

async function drawOsmTiles(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  zoom: number
) {
  const bounds = map.getBounds();
  const nw = bounds.getNorthWest();
  const se = bounds.getSouthEast();

  const tileXMin = Math.floor(lonToTileX(nw.lng, zoom));
  const tileXMax = Math.floor(lonToTileX(se.lng, zoom));
  const tileYMin = Math.floor(latToTileY(nw.lat, zoom));
  const tileYMax = Math.floor(latToTileY(se.lat, zoom));

  const tileJobs: { img: Promise<HTMLImageElement>; tx: number; ty: number }[] = [];
  for (let tx = tileXMin; tx <= tileXMax; tx++) {
    for (let ty = tileYMin; ty <= tileYMax; ty++) {
      const sub = ["a", "b", "c"][(tx + ty) % 3];
      const url = `https://${sub}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
      tileJobs.push({ img: loadImage(url), tx, ty });
    }
  }

  const settled = await Promise.allSettled(tileJobs.map((j) => j.img));
  for (let i = 0; i < tileJobs.length; i++) {
    const result = settled[i];
    if (result.status !== "fulfilled") continue;

    const { tx, ty } = tileJobs[i];
    const tileNW = tileToLatLon(tx, ty, zoom);
    const tileSE = tileToLatLon(tx + 1, ty + 1, zoom);

    const pxNW = map.latLngToContainerPoint(tileNW);
    const pxSE = map.latLngToContainerPoint(tileSE);

    ctx.drawImage(
      result.value,
      pxNW.x, pxNW.y,
      pxSE.x - pxNW.x, pxSE.y - pxNW.y
    );
  }
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  grense?: GeoJSON.Feature | null
) {
  if (!grense?.geometry) return;

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.fillStyle = "rgba(249, 115, 22, 0.2)";

  const rings = extractCoords(grense.geometry);
  for (const ring of rings) {
    if (ring.length === 0) continue;
    ctx.beginPath();
    const first = map.latLngToContainerPoint([ring[0][1], ring[0][0]]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < ring.length; i++) {
      const pt = map.latLngToContainerPoint([ring[i][1], ring[i][0]]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawMarkerOnCanvas(ctx: CanvasRenderingContext2D, map: L.Map) {
  let markerLatLng: L.LatLng | null = null;
  map.eachLayer((layer: any) => {
    if (layer.getLatLng && !markerLatLng) {
      markerLatLng = layer.getLatLng();
    }
  });

  const pinPos = markerLatLng
    ? map.latLngToContainerPoint(markerLatLng)
    : map.latLngToContainerPoint(map.getCenter());
  drawMarkerPin(ctx, pinPos.x, pinPos.y);
}

// --- WMS overlay drawing ---

interface WmsOverlayOptions {
  baseUrl: string;
  layers: string;
  opacity: number;
}

async function drawWmsOverlay(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  opts: WmsOverlayOptions
) {
  try {
    const size = map.getSize();
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const swM = toEpsg3857(sw.lat, sw.lng);
    const neM = toEpsg3857(ne.lat, ne.lng);

    const params = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.1.1",
      REQUEST: "GetMap",
      LAYERS: opts.layers,
      SRS: "EPSG:3857",
      BBOX: `${swM.x},${swM.y},${neM.x},${neM.y}`,
      WIDTH: String(size.x),
      HEIGHT: String(size.y),
      FORMAT: "image/png",
      TRANSPARENT: "true",
    });

    const wmsUrl = `${opts.baseUrl}?${params.toString()}`;
    const proxyUrl = `/api/wms-tile?url=${encodeURIComponent(wmsUrl)}`;

    const img = await loadImage(proxyUrl);
    ctx.globalAlpha = opts.opacity;
    ctx.drawImage(img, 0, 0, size.x, size.y);
    ctx.globalAlpha = 1;
  } catch {
    // WMS overlay failed — continue without it
  }
}

function toEpsg3857(lat: number, lon: number): { x: number; y: number } {
  const x = (lon * 20037508.34) / 180;
  const latRad = (lat * Math.PI) / 180;
  const y =
    (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * 20037508.34) / Math.PI;
  return { x, y };
}

// --- Tile math ---

function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tileToLatLon(tx: number, ty: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const lon = (tx / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
  const lat = (latRad * 180) / Math.PI;
  return [lat, lon];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function extractCoords(geometry: GeoJSON.Geometry): number[][][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates;
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat();
  }
  return [];
}

function drawMarkerPin(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const pinHeight = 36;
  const pinRadius = 12;

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Teardrop pin
  ctx.beginPath();
  ctx.fillStyle = "#2563eb";
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(
    x - pinRadius * 1.2, y - pinHeight * 0.5,
    x - pinRadius, y - pinHeight * 0.85,
    x, y - pinHeight
  );
  ctx.bezierCurveTo(
    x + pinRadius, y - pinHeight * 0.85,
    x + pinRadius * 1.2, y - pinHeight * 0.5,
    x, y
  );
  ctx.fill();

  ctx.shadowColor = "transparent";

  // White dot
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(x, y - pinHeight * 0.68, pinRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
