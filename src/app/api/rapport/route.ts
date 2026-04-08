import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { finnRelevanteTek17, TEK17_LOOKUP } from "@/lib/tek17-lookup";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude tool use schema — forces structured output
const rapportTool: Anthropic.Tool = {
  name: "generer_tomterapport",
  description:
    "Generer en strukturert tomterapport basert på analysedata. Alle kostnader skal ha intervall og usikkerhetsnivå. Sitér TEK17/PBL-paragrafer fra 'autoritative kilder' der relevant.",
  input_schema: {
    type: "object",
    properties: {
      oppsummering: {
        type: "string",
        description:
          "Helhetsvurdering på 2-4 setninger. Bruk modererende språk ('typisk', 'erfaringsmessig', 'avhengig av'). Ingen absolutte påstander. Maks 80 ord.",
      },
      rode_flagg: {
        type: "array",
        description:
          "Kritiske forhold kjøper må være oppmerksom på. Hvert flagg skal ha en konkret anbefaling og referere til TEK17/PBL-paragraf hvis relevant.",
        items: {
          type: "object",
          properties: {
            tema: { type: "string", description: "F.eks 'Kvikkleire', 'Uregulert område'" },
            beskrivelse: { type: "string", description: "1-2 setninger som forklarer funnet på hverdagsspråk." },
            paragraf: {
              type: "string",
              description:
                "TEK17- eller PBL-paragraf fra listen over autoritative kilder (f.eks 'TEK17 §13-5'). Utelat feltet hvis ingen passer.",
            },
            anbefaling: {
              type: "string",
              description:
                "Konkret handling: 'Kontakt geotekniker', 'Innhent VA-kostnad fra kommunen', etc. Aldri 'det må bare gjøres' uten alternativ.",
            },
          },
          required: ["tema", "beskrivelse", "anbefaling"],
        },
      },
      positive_funn: {
        type: "array",
        description: "2-5 positive forhold ved tomten. Korte setninger.",
        items: { type: "string" },
      },
      kostnadsfordyrende: {
        type: "array",
        description:
          "Kostnadsdrivende forhold med intervall og usikkerhetsnivå. ALDRI et spesifikt kostnadstall uten intervall.",
        items: {
          type: "object",
          properties: {
            tiltak: { type: "string", description: "F.eks 'Peling på leirgrunn', 'VA-tilknytning'" },
            intervall_kr: {
              type: "string",
              description:
                "Kostnadsintervall som tekst, f.eks '100 000 – 500 000 kr'. Bruk brede intervaller når usikkerheten er stor.",
            },
            usikkerhet: {
              type: "string",
              enum: ["lav", "middels", "hoy"],
              description:
                "'lav' = godt dokumenterte priser, 'middels' = varierer med forhold, 'hoy' = kan ikke estimeres seriøst uten befaring",
            },
            begrunnelse: {
              type: "string",
              description: "1 kort setning om hvorfor intervallet er som det er.",
            },
          },
          required: ["tiltak", "intervall_kr", "usikkerhet"],
        },
      },
      neste_steg: {
        type: "array",
        description: "3-5 konkrete neste steg kjøper bør ta før beslutning. Rekkefølge etter viktighet.",
        items: { type: "string" },
      },
      disclaimer: {
        type: "string",
        description:
          "Standardtekst: 'Estimatene over er indikative og basert på offentlige data. Innhent profesjonelle tilbud og fagkyndig rådgivning før kjøpsbeslutning.'",
      },
    },
    required: ["oppsummering", "rode_flagg", "positive_funn", "kostnadsfordyrende", "neste_steg", "disclaimer"],
  },
};

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

    // Find relevant TEK17/NVE/PBL paragraphs matching the findings
    const tek17Traff = finnRelevanteTek17(analysedata);
    const tek17Seksjon =
      tek17Traff.length > 0
        ? `\n\nAUTORITATIVE KILDER DU SKAL SITERE (bruk paragrafnummer eksplisitt i 'paragraf'-feltet på relevante røde_flagg):\n${tek17Traff
            .map(
              (t) =>
                `- ${t.paragraf} — ${t.tittel}\n  Tekst: ${t.tekst}\n  Konsekvens: ${t.konsekvens}`
            )
            .join("\n")}`
        : "";

    const systemPrompt = `Du er en norsk eiendomsanalytiker som lager en screeningrapport for en lekperson. Rapporten skal være ÆRLIG og YDMYK — den erstatter ikke profesjonelle undersøkelser.

KRITISKE REGLER (brudd = underkjent rapport):

1. ALDRI oppgi spesifikke kostnadstall uten intervall. Alle tall skal inn i "kostnadsfordyrende"-arrayet med intervall_kr + usikkerhet.
2. På leirgrunn/kvikkleire/ukjent grunn: bruk brede intervaller (f.eks "100 000 – 500 000 kr") og sett usikkerhet = "hoy". Ikke gi smale tall som fremstår som fasit.
3. Alle røde flagg skal ha en konkret anbefaling ("Kontakt geotekniker", "Innhent VA-tilbud fra kommunen") — aldri "det må" uten alternativ.
4. Sitér TEK17/PBL-paragrafer KUN fra listen over autoritative kilder. Oppfinn aldri paragrafnumre.
5. VA-tilknytning skal alltid vurderes — det er den dyreste ukjente på en ubebygd tomt.
6. Hvis reguleringsplan mangler: rødt flagg som viktigste punkt.
7. Disclaimer-feltet skal inneholde denne eksakte teksten: "Estimatene over er indikative og basert på offentlige data. Innhent profesjonelle tilbud og fagkyndig rådgivning før kjøpsbeslutning."

Bruk verktøyet "generer_tomterapport" for å returnere rapporten strukturert.`;

    const userPrompt = `Eiendom: "${adresse}"

Analysedata:
${JSON.stringify(analysedata, null, 2)}${tek17Seksjon}

Generer strukturert rapport via verktøyet.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      tools: [rapportTool],
      tool_choice: { type: "tool", name: "generer_tomterapport" },
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the tool_use block
    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "AI returnerte ingen strukturert rapport" },
        { status: 500 }
      );
    }

    const structured = toolUse.input as {
      oppsummering: string;
      rode_flagg: Array<{ tema: string; beskrivelse: string; paragraf?: string; anbefaling: string }>;
      positive_funn: string[];
      kostnadsfordyrende: Array<{
        tiltak: string;
        intervall_kr: string;
        usikkerhet: "lav" | "middels" | "hoy";
        begrunnelse?: string;
      }>;
      neste_steg: string[];
      disclaimer: string;
    };

    // Enrich flagg with paragraph links from lookup
    const rodeFlaggBeriket = structured.rode_flagg.map((f) => {
      if (f.paragraf) {
        const entry = Object.values(TEK17_LOOKUP).find((t) => t.paragraf === f.paragraf);
        return {
          tema: f.tema,
          beskrivelse: f.beskrivelse,
          paragraf: f.paragraf,
          paragrafLenke: entry?.lenke,
          anbefaling: f.anbefaling,
        };
      }
      return {
        tema: f.tema,
        beskrivelse: f.beskrivelse,
        anbefaling: f.anbefaling,
      };
    });

    // Build legacy text version for backward compatibility (PDF export)
    const textLines: string[] = [];
    textLines.push("Helhetsvurdering");
    textLines.push(structured.oppsummering);
    textLines.push("");
    if (structured.positive_funn.length > 0) {
      textLines.push("Positive funn");
      structured.positive_funn.forEach((p) => textLines.push(`- ${p}`));
      textLines.push("");
    }
    if (structured.rode_flagg.length > 0) {
      textLines.push("Ting å være oppmerksom på");
      structured.rode_flagg.forEach((f) => {
        const paraf = f.paragraf ? ` (${f.paragraf})` : "";
        textLines.push(`- ${f.tema}${paraf}: ${f.beskrivelse} ${f.anbefaling}`);
      });
      textLines.push("");
    }
    if (structured.kostnadsfordyrende.length > 0) {
      textLines.push("Mulige kostnadsdrivere");
      structured.kostnadsfordyrende.forEach((k) => {
        const usk = k.usikkerhet === "hoy" ? " [svært usikker]" : k.usikkerhet === "middels" ? " [middels usikker]" : "";
        textLines.push(`- ${k.tiltak}: ${k.intervall_kr}${usk}`);
      });
      textLines.push("");
    }
    if (structured.neste_steg.length > 0) {
      textLines.push("Neste steg");
      structured.neste_steg.forEach((s, i) => textLines.push(`${i + 1}. ${s}`));
      textLines.push("");
    }
    textLines.push(structured.disclaimer);

    return NextResponse.json({
      tekst: textLines.join("\n"),
      generert: new Date().toISOString(),
      strukturert: {
        oppsummering: structured.oppsummering,
        rodeFlagg: rodeFlaggBeriket,
        positiveFunn: structured.positive_funn,
        kostnadsfordyrende: structured.kostnadsfordyrende.map((k) => ({
          tiltak: k.tiltak,
          intervallKr: k.intervall_kr,
          usikkerhet: k.usikkerhet,
          begrunnelse: k.begrunnelse,
        })),
        nesteSteg: structured.neste_steg,
        disclaimer: structured.disclaimer,
      },
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
