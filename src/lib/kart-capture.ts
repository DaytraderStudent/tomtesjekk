import type L from "leaflet";

/**
 * Captures the current Leaflet map view as a PNG data-URL by drawing
 * OSM tiles + polygon + marker directly onto a canvas.
 *
 * This avoids html2canvas which mishandles Leaflet's CSS translate3d
 * transforms, causing polygon/marker to appear shifted.
 *
 * All coordinate mapping goes through Leaflet's latLngToContainerPoint
 * so tiles, polygon, and marker are guaranteed to be aligned, even at
 * fractional zoom levels.
 */
export async function taKartbilde(
  map: L.Map,
  _container: HTMLDivElement,
  grense?: GeoJSON.Feature | null
): Promise<string | null> {
  try {
    const size = map.getSize();
    const zoom = Math.round(map.getZoom());

    // Canvas dimensions (2x for retina sharpness)
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = size.x * scale;
    canvas.height = size.y * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(scale, scale);

    // --- 1. Draw OSM tiles ---
    const bounds = map.getBounds();
    const nw = bounds.getNorthWest();
    const se = bounds.getSouthEast();

    // Which tiles cover the visible area at this integer zoom?
    const tileXMin = Math.floor(lonToTileX(nw.lng, zoom));
    const tileXMax = Math.floor(lonToTileX(se.lng, zoom));
    const tileYMin = Math.floor(latToTileY(nw.lat, zoom));
    const tileYMax = Math.floor(latToTileY(se.lat, zoom));

    // Load all tile images in parallel
    const tileJobs: { img: Promise<HTMLImageElement>; tx: number; ty: number }[] = [];
    for (let tx = tileXMin; tx <= tileXMax; tx++) {
      for (let ty = tileYMin; ty <= tileYMax; ty++) {
        const sub = ["a", "b", "c"][(tx + ty) % 3];
        const url = `https://${sub}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
        tileJobs.push({ img: loadImage(url), tx, ty });
      }
    }

    // Draw each tile at the correct position by converting tile corners
    // to container pixels via Leaflet (handles fractional zoom correctly)
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

    // --- 2. Draw property boundary polygon ---
    if (grense?.geometry) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.fillStyle = "rgba(249, 115, 22, 0.2)";

      const rings = extractCoords(grense.geometry);
      for (const ring of rings) {
        if (ring.length === 0) continue;
        ctx.beginPath();
        // GeoJSON coords are [lon, lat]
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

    // --- 3. Draw marker pin ---
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

    // --- 4. Attribution ---
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText("\u00A9 OpenStreetMap", size.x - 110, size.y - 6);

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Kartfangst feilet:", e);
    return null;
  }
}

// --- Helpers ---

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

/** Convert tile coordinates back to lat/lon (NW corner of the tile) */
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

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Pin body (teardrop)
  ctx.beginPath();
  ctx.fillStyle = "#2563eb";
  ctx.moveTo(x, y); // bottom tip
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

  // White dot inside
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(x, y - pinHeight * 0.68, pinRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
