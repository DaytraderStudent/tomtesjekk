import type L from "leaflet";

export async function taKartbilde(
  map: L.Map,
  container: HTMLDivElement
): Promise<string | null> {
  try {
    // Find all WMS tile images (geonorge, vegvesen) — they lack CORS headers
    const wmsImages = container.querySelectorAll<HTMLImageElement>(
      'img[src*="geonorge.no"], img[src*="vegvesen.no"]'
    );

    // Hide them temporarily
    const origDisplay: string[] = [];
    wmsImages.forEach((img) => {
      origDisplay.push(img.style.display);
      img.style.display = "none";
    });

    const { default: html2canvas } = await import("html2canvas-pro");

    const canvas = await html2canvas(container, {
      useCORS: true,
      scale: 2,
      logging: false,
      allowTaint: false,
      backgroundColor: "#f0f0f0",
    });

    // Restore WMS layers
    wmsImages.forEach((img, i) => {
      img.style.display = origDisplay[i];
    });

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Kartfangst feilet:", e);
    return null;
  }
}
