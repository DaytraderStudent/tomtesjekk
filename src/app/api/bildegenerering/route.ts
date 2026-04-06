import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY ikke konfigurert" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { adresse, tomteareal, regulering, grunnforhold, solforhold, hoydeOverHavet } = body;

    if (!adresse) {
      return NextResponse.json(
        { error: "Mangler adresse" },
        { status: 400 }
      );
    }

    // Build a descriptive prompt from the analysis data
    const detaljer: string[] = [];

    if (tomteareal) {
      detaljer.push(`Tomteareal: ${Math.round(tomteareal)} m²`);
    }

    if (regulering) {
      if (regulering.maksEtasjer) detaljer.push(`Maks ${regulering.maksEtasjer} etasjer`);
      if (regulering.maksHoyde) detaljer.push(`Maks byggehøyde ${regulering.maksHoyde} m`);
      if (regulering.utnyttingsgrad && tomteareal) {
        const bya = Math.round((regulering.utnyttingsgrad / 100) * tomteareal);
        detaljer.push(`Maks bebygd areal (BYA): ca. ${bya} m²`);
      }
    }

    if (grunnforhold) {
      detaljer.push(`Grunnforhold: ${grunnforhold}`);
    }

    if (solforhold) {
      detaljer.push(`Hovedsolretning: ${solforhold}`);
    }

    if (hoydeOverHavet) {
      detaljer.push(`${Math.round(hoydeOverHavet)} moh.`);
    }

    const tomtebeskrivelse = detaljer.length > 0
      ? detaljer.join(". ") + "."
      : "Vanlig norsk boligtomt.";

    const prompt = `Generate a photorealistic architectural visualization of a modern Scandinavian house built on this Norwegian property:

Address: ${adresse}
${tomtebeskrivelse}

Requirements:
- Modern Scandinavian residential architecture (clean lines, natural materials, large windows)
- Norwegian landscape and vegetation appropriate for the location
- The house should realistically fit the plot constraints (size, height limits)
- Show the house from a slight aerial perspective so the plot is visible
- Natural daylight, realistic shadows
- Include typical Norwegian elements: wooden cladding, stone accents, flat or low-pitch roof
- The surrounding landscape should feel authentically Norwegian (birch trees, grass, rocks)

Style: Photorealistic architectural rendering, warm natural lighting, high quality`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        // @ts-expect-error - responseModalities not in types yet
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];

    let imageBase64: string | null = null;
    let beskrivelse: string | null = null;

    for (const part of parts) {
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
