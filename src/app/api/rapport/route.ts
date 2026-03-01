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

Helhetsvurdering
1-2 setninger om totalbildet.

Positive funn
- Kulepunkt med positive funn (bruk vanlig bindestrek, ikke markdown)

Ting å være oppmerksom på
- Kulepunkt med gule/røde flagg, hvis noen

Anbefaling
1-2 setninger med konkret råd.

Spesielle instruksjoner:
- Oversett tekniske grunnforhold-beskrivelser til hverdagsspråk. Forklar hva jordarten betyr i praksis og nevn omtrentlige merkostnader for fundament/graving der det er relevant (f.eks. peling, masseutskifting, sprengning).
- Nevn alltid VA-tilknytning (vann og avløp) under "Ting å være oppmerksom på". Anbefal at kjøper kontakter kommunen for å avklare avstand til VA-nett og tilknytningskostnad, da dette ikke er tilgjengelig i offentlige kartdata.
- Hvis reguleringsplan mangler (uregulert område), fremhev dette som den viktigste røde flaggen. Uten reguleringsplan er det stor usikkerhet rundt hva tomten kan brukes til.

VIKTIG: Skriv kun ren tekst. IKKE bruk markdown-formatering som #, ##, **, *, ✓ eller lignende. Bruk vanlig bindestrek (-) for kulepunkter. Overskrifter skal bare være tekst på egen linje uten noen formatering.

Hold oppsummeringen kortfattet (maks 250 ord). Ikke gjenta rådataene — fokuser på å tolke og forklare hva funnene betyr i praksis for en potensiell tomtekjøper.`;

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
