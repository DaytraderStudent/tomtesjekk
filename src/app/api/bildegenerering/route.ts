import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Three parallel Gemini image generations can take up to ~45s total
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Fetch aerial photo of the plot from Kartverket "Norge i bilder"
async function hentLuftfoto(lat: number, lon: number): Promise<string | null> {
  try {
    // Convert to EPSG:3857 (Web Mercator) for WMS BBOX
    const x = (lon * 20037508.34) / 180;
    const latRad = (lat * Math.PI) / 180;
    const y = (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * 20037508.34) / Math.PI;
    const delta = 120; // ~240m wide view of the plot

    const params = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.3.0",
      REQUEST: "GetMap",
      LAYERS: "ortofoto",
      STYLES: "",
      CRS: "EPSG:3857",
      BBOX: `${x - delta},${y - delta},${x + delta},${y + delta}`,
      WIDTH: "768",
      HEIGHT: "768",
      FORMAT: "image/jpeg",
    });

    const url = `https://wms.geonorge.no/skwms1/wms.nib?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    // NiB returns XML error (not image) when it blocks the request (IPv6, auth)
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;
    const buffer = await res.arrayBuffer();
    // Also reject suspiciously small responses (< 5KB = likely error/blank)
    if (buffer.byteLength < 5000) return null;
    const base64 = Buffer.from(buffer).toString("base64");
    return base64;
  } catch {
    return null;
  }
}

// Describe terrain based on elevation
function beskrivTerreng(hoydeOverHavet: number | null): string {
  if (!hoydeOverHavet) return "typical Norwegian terrain";
  if (hoydeOverHavet < 20) return "coastal / low-lying terrain, possibly near fjord or sea";
  if (hoydeOverHavet < 100) return "lowland area with typical mixed vegetation";
  if (hoydeOverHavet < 300) return "hilly inland terrain with forest and rock outcrops";
  if (hoydeOverHavet < 600) return "elevated terrain with birch, pine forest and exposed bedrock";
  return "mountain / sub-alpine terrain with sparse vegetation and rocky ground";
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY ikke konfigurert" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { adresse, lat, lon, tomteareal, regulering, grunnforhold, solforhold, hoydeOverHavet, bygningstype, brukerValg } = body;

    if (!adresse) {
      return NextResponse.json(
        { error: "Mangler adresse" },
        { status: 400 }
      );
    }

    // Build a descriptive prompt from the analysis data
    const detaljer: string[] = [];

    if (tomteareal) {
      detaljer.push(`Plot size: ${Math.round(tomteareal)} m²`);
    }

    if (regulering) {
      if (regulering.maksEtasjer) detaljer.push(`Max ${regulering.maksEtasjer} floors allowed`);
      if (regulering.maksHoyde) detaljer.push(`Max building height ${regulering.maksHoyde} m`);
      if (regulering.utnyttingsgrad && tomteareal) {
        const bya = Math.round((regulering.utnyttingsgrad / 100) * tomteareal);
        detaljer.push(`Max built footprint: ca. ${bya} m²`);
      }
    }

    if (grunnforhold) {
      detaljer.push(`Ground conditions: ${grunnforhold}`);
    }

    if (solforhold) {
      detaljer.push(`Main sun direction: ${solforhold}`);
    }

    if (hoydeOverHavet) {
      detaljer.push(`Elevation: ${Math.round(hoydeOverHavet)} m above sea level`);
      detaljer.push(`Terrain: ${beskrivTerreng(hoydeOverHavet)}`);
    }

    // Determine building type from user's choice
    const bygningsBeskrivelse = bygningstype === "naering" ? "commercial building"
      : bygningstype === "hytte" ? "Norwegian mountain/forest cabin (hytte)"
      : bygningstype === "blokk" ? "small apartment building"
      : bygningstype === "rekkehus" ? "townhouse / row house"
      : "modern Scandinavian detached house (enebolig)";

    // User's specific building preferences
    const brukerSpecs: string[] = [];
    if (brukerValg?.takform) {
      const takMap: Record<string, string> = {
        flatt: "flat roof", saltak: "gable/pitched roof (saltak)",
        pulttak: "shed/mono-pitch roof (pulttak)", valmtak: "hip roof (valmtak)",
        torvtak: "green/turf roof (torvtak)",
      };
      brukerSpecs.push(`Roof type: ${takMap[brukerValg.takform] || brukerValg.takform}`);
    }
    if (brukerValg?.etasjer) brukerSpecs.push(`${brukerValg.etasjer} floors/stories`);
    if (brukerValg?.bruksareal) brukerSpecs.push(`~${brukerValg.bruksareal} m² total floor area`);

    const tomtebeskrivelse = detaljer.length > 0 ? detaljer.join(". ") + "." : "";
    const brukerSpecsTekst = brukerSpecs.length > 0 ? `\n\nUser's building specification: ${brukerSpecs.join(", ")}.` : "";

    // Try to fetch aerial photo of the actual location
    let aerialBase64: string | null = null;
    if (typeof lat === "number" && typeof lon === "number") {
      aerialBase64 = await hentLuftfoto(lat, lon);
    }

    const baseContext = `Location: ${adresse}
${tomtebeskrivelse}${brukerSpecsTekst}

${aerialBase64 ? `IMPORTANT: The reference image shows the ACTUAL aerial/satellite view of this exact plot.
Place the building ON this specific plot. Match the real terrain, vegetation, roads, and neighboring structures visible in the reference.` : ""}

MANDATORY design constraints (these are regulatory requirements, not suggestions):
- Building type: ${bygningsBeskrivelse}
${brukerValg?.takform ? `- Roof: MUST be ${brukerSpecs[0]?.split(": ")[1] || brukerValg.takform}` : "- Roof: Modern Scandinavian (flat or low-pitch)"}
${brukerValg?.etasjer ? `- EXACTLY ${brukerValg.etasjer} floors — no more, no less` : ""}
${brukerValg?.bruksareal ? `- Approximately ${brukerValg.bruksareal} m² — the building should look like this size` : ""}
${regulering?.maksHoyde ? `- Maximum building height: ${regulering.maksHoyde} meters (regulatory limit)` : ""}
- Natural wood cladding (dark or natural tones), large windows
- Norwegian architectural style — clean lines, stone accents
- Realistic soft daylight and natural shadows
- The building must look BUILDABLE — not a fantasy rendering`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        // @ts-expect-error - responseModalities not in types yet
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Helper to call Gemini and extract image
    async function genererBilde(prompt: string, referansebilder: string[]): Promise<{ base64: string; beskrivelse: string | null }> {
      const parts: any[] = [{ text: prompt }];
      for (const ref of referansebilder) {
        parts.push({ inlineData: { mimeType: "image/png", data: ref } });
      }
      const result = await model.generateContent(parts);
      const responseParts = result.response.candidates?.[0]?.content?.parts || [];
      let imageBase64: string | null = null;
      let beskrivelse: string | null = null;
      for (const part of responseParts) {
        if (part.inlineData) imageBase64 = part.inlineData.data;
        if (part.text) beskrivelse = part.text;
      }
      if (!imageBase64) throw new Error("No image generated");
      return { base64: imageBase64, beskrivelse };
    }

    const bilder: Array<{ id: string; label: string; bilde: string; beskrivelse: string | null }> = [];

    // STEP 1: Generate the PRIMARY view (aerial/drone) — this establishes the house design
    const mainPrompt = `Create a photorealistic architectural visualization of a ${bygningsBeskrivelse} built on a Norwegian property.

Camera angle: high aerial perspective (drone view from above), looking down at a ~30 degree tilt. Show the house and the entire plot with surrounding vegetation.

${baseContext}

IMPORTANT: Design ONE specific house with distinctive features (roof shape, cladding color, window placement, terrace) that make it identifiable from any angle.

Style: Photorealistic architectural rendering, warm natural Scandinavian light.`;

    const referanser: string[] = [];
    if (aerialBase64) referanser.push(aerialBase64);

    try {
      const main = await genererBilde(mainPrompt, referanser);
      bilder.push({ id: "aerial", label: "Ovenfra", bilde: `data:image/png;base64,${main.base64}`, beskrivelse: main.beskrivelse });

      // STEP 2: Generate secondary views using the FIRST image as reference — ensures same house
      const sekundaerVinkler = [
        {
          id: "southeast",
          label: "Sørøst 45°",
          prompt: `Show the EXACT SAME HOUSE from the reference image, but from a different camera angle:

Camera: eye-level view from the southeast (sunny side), at ~45 degrees above horizon. Warm afternoon light on the façade. Show garden and entry.

The house MUST have the same roof shape, cladding, windows, and terrace as in the reference image. Do NOT change the design — only the viewing angle.

${baseContext}

Style: Photorealistic, same house design as reference.`,
        },
        {
          id: "streetlevel",
          label: "Gateplan",
          prompt: `Show the EXACT SAME HOUSE from the reference image, but from street level:

Camera: standing at the entrance/driveway, looking at the house from the approach road. Eye-level Norwegian suburban perspective.

The house MUST have the same roof shape, cladding, windows, and design as in the reference image. Do NOT redesign the house — only change the camera position.

${baseContext}

Style: Photorealistic, same house design as reference.`,
        },
      ];

      // Generate both secondary views in parallel, using the main image as reference
      const sekundaerRes = await Promise.allSettled(
        sekundaerVinkler.map(async (v) => {
          const res = await genererBilde(v.prompt, [main.base64]);
          return { id: v.id, label: v.label, bilde: `data:image/png;base64,${res.base64}`, beskrivelse: res.beskrivelse };
        })
      );

      for (const r of sekundaerRes) {
        if (r.status === "fulfilled") bilder.push(r.value);
      }
    } catch {
      // If main generation fails, bilder stays empty — handled below
    }

    if (bilder.length === 0) {
      return NextResponse.json(
        { error: "Kunne ikke generere noen bilder — prøv igjen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bilder,
      // Backward-compat: primary image + description as first angle
      bilde: bilder[0].bilde,
      beskrivelse: bilder[0].beskrivelse,
      referansebildeBase64: aerialBase64 ? `data:image/jpeg;base64,${aerialBase64}` : null,
      brukteReferansebilde: !!aerialBase64,
      generert: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Gemini bildegenerering error:", error);
    return NextResponse.json(
      {
        error: "Kunne ikke generere bilde",
        detaljer: error.message,
      },
      { status: 500 }
    );
  }
}
