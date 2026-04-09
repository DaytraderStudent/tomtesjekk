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

async function hentOrtofoto(lat: number, lon: number): Promise<{ base64: string; kilde: "ortofoto" | "kart" } | null> {
  // Try 1: Kartverket Norge i bilder (high-quality aerial)
  try {
    const x = (lon * 20037508.34) / 180;
    const latRad = (lat * Math.PI) / 180;
    const y = (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * 20037508.34) / Math.PI;
    const delta = 150;

    const params = new URLSearchParams({
      SERVICE: "WMS", VERSION: "1.3.0", REQUEST: "GetMap",
      LAYERS: "ortofoto", STYLES: "", CRS: "EPSG:3857",
      BBOX: `${x - delta},${y - delta},${x + delta},${y + delta}`,
      WIDTH: "1024", HEIGHT: "1024", FORMAT: "image/jpeg",
    });

    const url = `https://wms.geonorge.no/skwms1/wms.nib?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("image")) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 5000) {
          return { base64: Buffer.from(buffer).toString("base64"), kilde: "ortofoto" };
        }
      }
    }
  } catch {}

  // Try 2: Fallback to OSM map tiles (always available)
  try {
    // Calculate OSM tile coordinates at zoom 15 (neighborhood level)
    const zoom = 15;
    const n = Math.pow(2, zoom);
    const tileX = Math.floor(((lon + 180) / 360) * n);
    const tileY = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
    );

    // Fetch a 3x3 grid of tiles for wider context
    const tiles: Buffer[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const abc = ["a", "b", "c"][(dx + 1 + (dy + 1) * 3) % 3];
        const tileUrl = `https://${abc}.tile.openstreetmap.org/${zoom}/${tileX + dx}/${tileY + dy}.png`;
        const res = await fetch(tileUrl, {
          headers: { "User-Agent": "Tomtesjekk/1.0 (tomtesjekk.vercel.app)" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          tiles.push(Buffer.from(await res.arrayBuffer()));
        }
      }
    }

    if (tiles.length >= 5) {
      // Use sharp to composite tiles into one image
      const sharp = (await import("sharp")).default;
      const composite = sharp({
        create: { width: 768, height: 768, channels: 3, background: { r: 245, g: 242, b: 235 } },
      });
      const composed = await composite
        .composite(
          tiles.slice(0, 9).map((buf, i) => ({
            input: buf,
            top: Math.floor(i / 3) * 256,
            left: (i % 3) * 256,
          }))
        )
        .jpeg({ quality: 80 })
        .toBuffer();
      return { base64: composed.toString("base64"), kilde: "kart" };
    }
  } catch {}

  return null;
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

    const bildeData = await hentOrtofoto(lat, lon);
    if (!bildeData) {
      return NextResponse.json(
        { error: "Kunne ikke hente bilde av tomten. Prøv igjen senere." },
        { status: 503 }
      );
    }

    const bildeType = bildeData.kilde === "ortofoto"
      ? "et ortofoto (luftfoto)"
      : "et detaljert kart (OpenStreetMap)";

    const bildeInstruks = bildeData.kilde === "ortofoto"
      ? "Identifiser fysiske forhold som er SYNLIGE i bildet — vegetasjon, bygninger, terreng, veier, vassdrag."
      : "Identifiser infrastruktur, bebyggelsesmønster, veier, grøntområder og terrengforhold som er synlige i kartet. Beskriv hva kartet forteller om området.";

    const prompt = `Du ser på ${bildeType} av en norsk tomt${adresse ? ` ved ${adresse}` : ""}. Koordinater: ${lat.toFixed(5)}, ${lon.toFixed(5)}.

${bildeInstruks}

Gi en kort, faktabasert analyse. Svar BARE med JSON (ingen markdown, ingen kodeblokk), med dette skjemaet:

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
          data: bildeData.base64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON — Gemini may wrap in markdown code fence or produce malformed JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI returnerte ikke gyldig JSON", raw: text.substring(0, 300) },
        { status: 500 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Try to fix common Gemini JSON issues: trailing commas, unescaped quotes
      const cleaned = jsonMatch[0]
        .replace(/,\s*([}\]])/g, "$1") // trailing commas
        .replace(/[\u201C\u201D]/g, '"') // smart quotes
        .replace(/[\u2018\u2019]/g, "'"); // smart apostrophes
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Last resort: extract what we can
        parsed = {
          sammendrag: text.substring(0, 200),
          observasjoner: [],
        };
      }
    }

    return NextResponse.json({
      sammendrag: parsed.sammendrag || "",
      observasjoner: parsed.observasjoner || [],
      ortofotoBase64: `data:image/jpeg;base64,${bildeData.base64}`,
      bildeKilde: bildeData.kilde,
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
