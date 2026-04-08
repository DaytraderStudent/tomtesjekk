import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Foto-analyse: multimodal grounding av Gemini mot ortofoto.
 *
 * Henter et ortofoto fra Kartverket "Norge i bilder" av den aktuelle
 * tomten og sender det til Gemini 2.5 Flash for faktabasert analyse
 * av fysiske forhold (vegetasjon, eksisterende bygninger, terreng,
 * adkomst, vassdrag).
 *
 * Dette er den tredje instansen av multimodal grounding i prosjektet,
 * og demonstrerer hvordan en visuell datakilde kan "forankre" AI-tolkning
 * i faktiske fysiske forhold — i kontrast til ren tekst-tolkning som
 * er langt mer utsatt for hallusinasjon.
 */

async function hentOrtofoto(lat: number, lon: number): Promise<string | null> {
  try {
    // Convert to EPSG:3857 (Web Mercator)
    const x = (lon * 20037508.34) / 180;
    const latRad = (lat * Math.PI) / 180;
    const y = (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * 20037508.34) / Math.PI;
    const delta = 150; // ~300m wide view — bigger than the one used for bildegenerering

    const params = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.3.0",
      REQUEST: "GetMap",
      LAYERS: "ortofoto",
      STYLES: "",
      CRS: "EPSG:3857",
      BBOX: `${x - delta},${y - delta},${x + delta},${y + delta}`,
      WIDTH: "1024",
      HEIGHT: "1024",
      FORMAT: "image/jpeg",
    });

    const url = `https://wms.geonorge.no/skwms1/wms.nib?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
    return null;
  }
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
    const { lat, lon, adresse } = body;

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Mangler lat/lon" },
        { status: 400 }
      );
    }

    const ortofotoBase64 = await hentOrtofoto(lat, lon);
    if (!ortofotoBase64) {
      return NextResponse.json(
        { error: "Kunne ikke hente ortofoto fra Kartverket" },
        { status: 500 }
      );
    }

    const prompt = `Du ser på et ortofoto (luftfoto) av en norsk tomt${adresse ? ` ved ${adresse}` : ""}. Koordinater: ${lat.toFixed(5)}, ${lon.toFixed(5)}.

Gi en kort, faktabasert analyse av hva som er synlig i bildet. Svar BARE med JSON (ingen markdown, ingen kodeblokk), med dette skjemaet:

{
  "sammendrag": "Én setning som beskriver det samlede inntrykket av tomten og nærmiljøet.",
  "observasjoner": [
    {
      "kategori": "Vegetasjon" | "Bebyggelse" | "Terreng" | "Adkomst" | "Vann" | "Annet",
      "funn": "Kort faktabasert observasjon (maks 15 ord)",
      "relevans": "Kort forklaring av hva dette betyr for en som vurderer å bygge (maks 15 ord)"
    }
  ]
}

Regler:
1. ALDRI finn opp ting du ikke kan se i bildet. Hvis du er usikker, si "uklart" eller utelat observasjonen.
2. Vær konkret: "tett furuskog på nordsiden", ikke "mye trær"
3. Inkluder 4-8 observasjoner totalt, fordelt på relevante kategorier.
4. Skriv på norsk bokmål.
5. For "Bebyggelse": tell omtrentlig antall bygninger i nærheten, nevn om området virker etablert eller spredt.
6. For "Terreng": se etter helning, nivåforskjeller, åpne flater vs skrånende partier.
7. For "Adkomst": se etter veier, stier, bruer — er det tydelig innkjøring?
8. For "Vann": elver, bekker, våtmarker, tjern.
9. Ikke spekuler i eiendomsgrenser, plandata eller juridiske forhold — bare hva som er visuelt tydelig.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: ortofotoBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON — Gemini may wrap in markdown code fence despite instructions
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI returnerte ikke gyldig JSON", raw: text },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      sammendrag: parsed.sammendrag || "",
      observasjoner: parsed.observasjoner || [],
      ortofotoBase64: `data:image/jpeg;base64,${ortofotoBase64}`,
      generert: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Foto-analyse error:", error);
    return NextResponse.json(
      { error: "Kunne ikke analysere foto", detaljer: error.message },
      { status: 500 }
    );
  }
}
