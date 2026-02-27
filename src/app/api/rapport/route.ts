import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adresse, analysedata } = body;

    if (!adresse || !analysedata) {
      return NextResponse.json(
        { error: "Mangler adresse eller analysedata" },
        { status: 400 }
      );
    }

    const prompt = `Du er en norsk eiendomsanalytiker. Basert på følgende data for eiendommen "${adresse}", gi en kortfattet og lettlest oppsummering på norsk. Bruk et profesjonelt men tilgjengelig språk.

Analysedata:
${JSON.stringify(analysedata, null, 2)}

Skriv en oppsummering med følgende struktur:
1. **Helhetsvurdering** (1-2 setninger om totalbildet)
2. **Positive funn** (bullet points med grønne flagg)
3. **Ting å være oppmerksom på** (bullet points med gule/røde flagg, hvis noen)
4. **Anbefaling** (1-2 setninger med konkret råd)

Hold oppsummeringen kortfattet (maks 200 ord). Ikke gjenta rådataene — fokuser på å tolke og forklare hva funnene betyr i praksis for en potensiell tomtekjøper.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const tekst =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      tekst,
      generert: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      {
        error: "Kunne ikke generere AI-oppsummering",
        detaljer: error.message,
      },
      { status: 500 }
    );
  }
}
