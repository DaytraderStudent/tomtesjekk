import type L from "leaflet";

/**
 * Captures the current Leaflet map view as a PNG data-URL by drawing
 * OSM tiles + polygon + marker directly onto a canvas.
 *
 * This avoids html2canvas which mishandles Leaflet's CSS translate3d
 * transforms, causing polygon/marker to appear shifted.
 */
export async function taKartbilde(
  map: L.Map,
  _container: HTMLDivElement,
  grense?: GeoJSON.Feature | null
): Promise<string | null> {
  try {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const size = map.getSize();

    // Canvas dimensions (2x for retina)
    const scale = 2;
    const w = size.x * scale;
    const h = size.y * scale;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // --- 1. Draw OSM tiles ---
    const tileSize = 256;
    const nw = bounds.getNorthWest();
    const se = bounds.getSouthEast();

    // Convert lat/lon to tile coordinates
    const xMin = lonToTileX(nw.lng, zoom);
    const xMax = lonToTileX(se.lng, zoom);
    const yMin = latToTileY(nw.lat, zoom);
    const yMax = latToTileY(se.lat, zoom);

    const tileXMin = Math.floor(xMin);
    const tileXMax = Math.floor(xMax);
    const tileYMin = Math.floor(yMin);
    const tileYMax = Math.floor(yMax);

    // Pixel offset of the top-left tile corner relative to the canvas
    const offsetX = (tileXMin - xMin) * tileSize;
    const offsetY = (tileYMin - yMin) * tileSize;

    // Load all tiles in parallel
    const tilePromises: Promise<void>[] = [];
    for (let tx = tileXMin; tx <= tileXMax; tx++) {
      for (let ty = tileYMin; ty <= tileYMax; ty++) {
        const px = offsetX + (tx - tileXMin) * tileSize;
        const py = offsetY + (ty - tileYMin) * tileSize;
        const url = `https://a.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;

        tilePromises.push(
          loadImage(url).then((img) => {
            ctx.drawImage(img, px, py, tileSize, tileSize);
          }).catch(() => {
            // Fill with light gray if tile fails
            ctx.fillStyle = "#e5e5e5";
            ctx.fillRect(px, py, tileSize, tileSize);
          })
        );
      }
    }

    await Promise.all(tilePromises);

    // --- 2. Draw property boundary polygon ---
    if (grense?.geometry) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.fillStyle = "rgba(249, 115, 22, 0.2)";

      const coords = extractCoords(grense.geometry);
      for (const ring of coords) {
        if (ring.length === 0) continue;
        ctx.beginPath();
        const first = latLonToPixel(ring[0][1], ring[0][0], map, size);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < ring.length; i++) {
          const pt = latLonToPixel(ring[i][1], ring[i][0], map, size);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // --- 3. Draw marker pin ---
    const center = map.getCenter();
    // Find the marker position — use the first marker on the map
    let markerLatLng: L.LatLng | null = null;
    map.eachLayer((layer: any) => {
      if (layer.getLatLng && !markerLatLng) {
        markerLatLng = layer.getLatLng();
      }
    });

    if (markerLatLng) {
      const mp = latLonToPixel(
        (markerLatLng as any).lat,
        (markerLatLng as any).lng,
        map,
        size
      );
      drawMarkerPin(ctx, mp.x, mp.y);
    } else {
      // Fallback: draw at map center
      const cp = latLonToPixel(center.lat, center.lng, map, size);
      drawMarkerPin(ctx, cp.x, cp.y);
    }

    // --- 4. Attribution ---
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText("© OpenStreetMap", size.x - 110, size.y - 6);

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

function latLonToPixel(
  lat: number,
  lon: number,
  map: L.Map,
  size: L.Point
): { x: number; y: number } {
  const point = map.latLngToContainerPoint([lat, lon]);
  return { x: point.x, y: point.y };
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
  // Draw a map pin: teardrop shape with white circle
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
  ctx.moveTo(x, y); // bottom point
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

  // White circle inside
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(x, y - pinHeight * 0.68, pinRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
