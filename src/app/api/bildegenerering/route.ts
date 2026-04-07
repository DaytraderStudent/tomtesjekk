import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const buffer = await res.arrayBuffer();
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
    const { adresse, lat, lon, tomteareal, regulering, grunnforhold, solforhold, hoydeOverHavet, bygningstype } = body;

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

    // Determine building type description
    const bygningsBeskrivelse = bygningstype === "naering" ? "commercial building"
      : bygningstype === "hytte" ? "Norwegian mountain/forest cabin (hytte)"
      : bygningstype === "blokk" ? "small apartment building"
      : bygningstype === "rekkehus" ? "townhouse / row house"
      : "modern Scandinavian detached house (enebolig)";

    const tomtebeskrivelse = detaljer.length > 0 ? detaljer.join(". ") + "." : "";

    // Try to fetch aerial photo of the actual location
    let aerialBase64: string | null = null;
    if (typeof lat === "number" && typeof lon === "number") {
      aerialBase64 = await hentLuftfoto(lat, lon);
    }

    const basePrompt = `Create a photorealistic architectural visualization of a ${bygningsBeskrivelse} built on this specific Norwegian property.

Location: ${adresse}
${tomtebeskrivelse}

${aerialBase64 ? `IMPORTANT: The reference image shows the ACTUAL aerial/satellite view of this exact plot. Use it to understand:
- The real terrain, vegetation, and surrounding landscape
- Existing roads, neighboring buildings, forest/water nearby
- The actual orientation and shape of the plot
- The authentic character of this specific location

Generate the house so it fits naturally into THIS exact environment — match the vegetation, terrain, surrounding architecture style, and landscape character visible in the reference image.` : ""}

Design requirements:
- Modern Scandinavian architecture with clean lines, natural wood cladding, large windows
- The house must fit the plot constraints (size, height, floor limits above)
- Respect the actual terrain and landscape — don't add fictional mountains, sea or features that aren't there
- Include authentic Norwegian elements: wood siding (often dark or natural), stone accents, flat or low-pitch roof
- Vegetation and surroundings should match what's actually visible in the reference image (pine, birch, spruce, grass, rocks — whatever is there)
- Realistic soft daylight and natural shadows
- Slightly elevated camera angle showing both the house and the surrounding plot context

Style: Photorealistic architectural rendering. Must look like it belongs in THIS specific Norwegian location.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        // @ts-expect-error - responseModalities not in types yet
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Build content parts: text + optional reference image
    const parts: any[] = [{ text: basePrompt }];
    if (aerialBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: aerialBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const responseParts = response.candidates?.[0]?.content?.parts || [];

    let imageBase64: string | null = null;
    let beskrivelse: string | null = null;

    for (const part of responseParts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
      }
      if (part.text) {
        beskrivelse = part.text;
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Kunne ikke generere bilde — prøv igjen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bilde: `data:image/png;base64,${imageBase64}`,
      beskrivelse,
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
