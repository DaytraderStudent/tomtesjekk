import { NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { hentKommuneBbox, genererRutenett, hentNaermesteAdresse, BYGNINGSTYPE_TIL_FORMAAL } from "@/lib/tomtefinner-helpers";
import Anthropic from "@anthropic-ai/sdk";

// Allow up to 60s on Vercel (streaming keeps connection alive)
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Helper to write a JSON line to the stream
function jsonLine(writer: WritableStreamDefaultWriter<Uint8Array>, data: Record<string, any>) {
  const encoder = new TextEncoder();
  writer.write(encoder.encode(JSON.stringify(data) + "\n"));
}

// Check zoning at a point by calling our own reguleringsplan API route
// This reuses the full logic (reguleringsplan + kommuneplan fallback + SOSI mapping)
async function sjekkReguleringServer(lat: number, lon: number, baseUrl: string) {
  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/api/reguleringsplan?lat=${lat}&lon=${lon}`,
      {},
      10000
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.harPlan === false) return null;
    // harPlan === null means "data unavailable" — skip these too
    if (data.harPlan === null) return null;
    return {
      harPlan: true,
      arealformaal: data.arealformaal || null,
      planNavn: data.planNavn || null,
    };
  } catch {
    return null;
  }
}

// Run a quick NVE risk check at a point
async function sjekkNveRisiko(lat: number, lon: number) {
  try {
    const res = await fetchWithTimeout(
      `https://gis3.nve.no/arcgis/rest/services/FlomAktsomhet/MapServer/identify?f=json&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=10&mapExtent=${lon - 0.001},${lat - 0.001},${lon + 0.001},${lat + 0.001}&imageDisplay=800,600,96&returnGeometry=false`,
      {},
      6000
    );
    if (!res.ok) return { flomfare: false };
    const data = await res.json();
    const harFlom = data.results?.some((r: any) => r.layerName?.toLowerCase().includes("aktsomhetsområde"));
    return { flomfare: !!harFlom };
  } catch {
    return { flomfare: false };
  }
}

// Run analysis on a single candidate point
async function analyserPunkt(lat: number, lon: number, baseUrl: string) {
  const kort: Array<{ kategori: string; status: string; detaljer: string }> = [];

  const [regRes, nveRes, radonRes, grunnRes, nvdbRes, stoyRes, solRes] = await Promise.allSettled([
    fetchWithTimeout(`${baseUrl}/api/reguleringsplan?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
    fetchWithTimeout(`${baseUrl}/api/nve?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
    fetchWithTimeout(`${baseUrl}/api/ngu-radon?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
    fetchWithTimeout(`${baseUrl}/api/ngu-grunn?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
    fetchWithTimeout(`${baseUrl}/api/nvdb?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
    fetchWithTimeout(`${baseUrl}/api/stoy?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
    fetchWithTimeout(`${baseUrl}/api/solforhold?lat=${lat}&lon=${lon}`, {}, 8000).then(r => r.json()),
  ]);

  if (regRes.status === "fulfilled" && !regRes.value.error) {
    const r = regRes.value;
    kort.push({
      kategori: "Reguleringsplan",
      status: r.harPlan ? "Regulert" : r.harPlan === null ? "Ukjent" : "Uregulert",
      detaljer: r.detaljer || (r.arealformaal ? `Formål: ${r.arealformaal}` : "Ingen data"),
    });
  }

  if (nveRes.status === "fulfilled" && !nveRes.value.error) {
    const n = nveRes.value;
    const risiko = [];
    if (n.flom?.aktsomhetsomrade) risiko.push("flomfare");
    if (n.skred?.aktsomhetsomrade) risiko.push("skredfare");
    if (n.kvikkleire?.faresone) risiko.push("kvikkleire");
    kort.push({
      kategori: "Naturfare",
      status: risiko.length ? `Risiko: ${risiko.join(", ")}` : "Lav risiko",
      detaljer: risiko.length ? `Funn: ${risiko.join(", ")}` : "Ingen aktsomhetsområder registrert",
    });
  }

  if (radonRes.status === "fulfilled" && !radonRes.value.error) {
    kort.push({
      kategori: "Radon",
      status: radonRes.value.nivaaTekst || "Ukjent",
      detaljer: radonRes.value.detaljer || "",
    });
  }

  if (grunnRes.status === "fulfilled" && !grunnRes.value.error) {
    kort.push({
      kategori: "Grunnforhold",
      status: grunnRes.value.jordart || "Ukjent",
      detaljer: grunnRes.value.beskrivelse || "",
    });
  }

  if (nvdbRes.status === "fulfilled" && !nvdbRes.value.error) {
    kort.push({
      kategori: "Veitilgang",
      status: `${nvdbRes.value.avstand} m til vei`,
      detaljer: nvdbRes.value.detaljer || "",
    });
  }

  if (stoyRes.status === "fulfilled" && !stoyRes.value.error) {
    const s = stoyRes.value;
    kort.push({
      kategori: "Støy",
      status: s.harStoy ? `${s.nivaDb} dB` : "Lavt støynivå",
      detaljer: s.detaljer || "",
    });
  }

  if (solRes.status === "fulfilled" && !solRes.value.error) {
    const s = solRes.value;
    kort.push({
      kategori: "Solforhold",
      status: `Hovedretning: ${s.hovedretning}`,
      detaljer: `Sommer: ${s.sommer?.daglengdeTimer}t dagslys. Vinter: ${s.vinter?.daglengdeTimer}t dagslys.`,
    });
  }

  return kort;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { kommunenummer, kommunenavn, bygningstype, preferanser, arealMin, arealMax, etasjer } = body;

  if (!kommunenummer || !bygningstype) {
    return new Response(JSON.stringify({ error: "Mangler kommunenummer eller bygningstype" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const baseUrl = request.nextUrl.origin;

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Run the pipeline in the background
  (async () => {
    try {
      const startTid = Date.now();

      jsonLine(writer, {
        type: "status",
        melding: `Henter kommunegrenser for ${kommunenavn || kommunenummer}...`,
      });

      // Step 1: Get municipality bounding box
      const bbox = await hentKommuneBbox(kommunenummer);
      if (!bbox) {
        jsonLine(writer, { type: "feil", melding: "Kunne ikke hente kommunegrenser" });
        writer.close();
        return;
      }

      jsonLine(writer, {
        type: "status",
        melding: `Søker etter ${bygningstype === "naering" ? "nærings" : bygningstype}områder i ${kommunenavn}...`,
      });

      // Step 2: Generate sample grid points across the municipality (denser grid)
      const rutenett = genererRutenett(bbox, 64);

      jsonLine(writer, {
        type: "status",
        melding: `Sjekker regulering på ${rutenett.length} punkter...`,
      });

      // Step 3: Check zoning at each point in parallel (batches of 8 to avoid overload)
      const formaalSokeord = BYGNINGSTYPE_TIL_FORMAAL[bygningstype] || ["Bebyggelse"];
      const kandidater: Array<{ lat: number; lon: number; arealformaal: string; planNavn: string | null }> = [];

      for (let i = 0; i < rutenett.length; i += 8) {
        const batch = rutenett.slice(i, i + 8);
        const resultater = await Promise.allSettled(
          batch.map((p) => sjekkReguleringServer(p.lat, p.lon, baseUrl))
        );

        for (let j = 0; j < resultater.length; j++) {
          const r = resultater[j];
          if (r.status === "fulfilled" && r.value?.harPlan && r.value.arealformaal) {
            const formaalLower = r.value.arealformaal.toLowerCase();
            const matcher = formaalSokeord.some((s) => formaalLower.includes(s.toLowerCase()));
            if (matcher) {
              kandidater.push({
                lat: batch[j].lat,
                lon: batch[j].lon,
                arealformaal: r.value.arealformaal,
                planNavn: r.value.planNavn,
              });
            }
          }
        }
      }

      jsonLine(writer, {
        type: "kandidater_funnet",
        antall: kandidater.length,
        melding: `Fant ${kandidater.length} aktuelle områder`,
      });

      if (kandidater.length === 0) {
        jsonLine(writer, {
          type: "ferdig",
          melding: `Fant ingen områder regulert for ${bygningstype} i ${kommunenavn}. Prøv en annen kommune eller bygningstype.`,
          resultater: [],
        });
        writer.close();
        return;
      }

      // Step 4: Quick NVE risk filter if user wants low risk
      let filtrerteKandidater = kandidater;
      if (preferanser?.lavRisiko) {
        jsonLine(writer, { type: "status", melding: "Filtrerer mot naturfare..." });
        const nveResultater = await Promise.allSettled(
          kandidater.map((k) => sjekkNveRisiko(k.lat, k.lon))
        );
        filtrerteKandidater = kandidater.filter((_, i) => {
          const r = nveResultater[i];
          return r.status === "fulfilled" && !r.value.flomfare;
        });

        if (filtrerteKandidater.length === 0) filtrerteKandidater = kandidater.slice(0, 5);
      }

      // Step 5: Deep analyze top 8 candidates
      const topp = filtrerteKandidater.slice(0, 8);
      jsonLine(writer, {
        type: "status",
        melding: `Analyserer ${topp.length} tomteområder...`,
      });

      const analyseResultater: Array<{
        kandidat: typeof topp[0];
        kort: Awaited<ReturnType<typeof analyserPunkt>>;
        adresse: string;
      }> = [];

      // Analyze in batches of 4
      for (let i = 0; i < topp.length; i += 4) {
        const batch = topp.slice(i, i + 4);
        const [analyser, adresser] = await Promise.all([
          Promise.allSettled(batch.map((k) => analyserPunkt(k.lat, k.lon, baseUrl))),
          Promise.allSettled(batch.map((k) => hentNaermesteAdresse(k.lat, k.lon))),
        ]);

        for (let j = 0; j < batch.length; j++) {
          const aRes = analyser[j];
          const dRes = adresser[j];
          const kort = aRes.status === "fulfilled" ? aRes.value : [];
          const adresse = dRes.status === "fulfilled" ? dRes.value : `${batch[j].lat.toFixed(4)}, ${batch[j].lon.toFixed(4)}`;

          analyseResultater.push({ kandidat: batch[j], kort, adresse });

          jsonLine(writer, {
            type: "kandidat_analysert",
            id: `k${analyseResultater.length}`,
            lat: batch[j].lat,
            lon: batch[j].lon,
            adresse,
            arealformaal: batch[j].arealformaal,
            antallAnalyser: kort.length,
          });
        }
      }

      // Step 6: Claude ranks the candidates
      jsonLine(writer, { type: "status", melding: "AI rangerer kandidatene..." });

      const brukerKrav = [
        `Bygningstype: ${bygningstype}`,
        arealMin ? `Minimum tomteareal: ${arealMin} m²` : null,
        arealMax ? `Maksimum tomteareal: ${arealMax} m²` : null,
        etasjer ? `Ønsket antall etasjer: ${etasjer}` : null,
        preferanser?.solretning && preferanser.solretning !== "likegyldig" ? `Foretrukket solretning: ${preferanser.solretning}` : null,
        preferanser?.stille ? "Ønsker lite støy" : null,
        preferanser?.veinaerhet ? "Ønsker nærhet til vei" : null,
        preferanser?.lavRisiko ? "Ønsker lav naturfare-risiko" : null,
      ].filter(Boolean).join("\n");

      const kandidatBeskrivelser = analyseResultater.map((r, i) => {
        const kortTekst = r.kort.map((k) => `  ${k.kategori}: ${k.status} — ${k.detaljer}`).join("\n");
        return `Kandidat ${i + 1}: ${r.adresse}\nArealformål: ${r.kandidat.arealformaal}\n${kortTekst}`;
      }).join("\n\n");

      const rangerPrompt = `Du er en norsk eiendomsrådgiver. Ranger følgende tomteområder basert på brukerens krav.

Brukerens krav:
${brukerKrav}

Kandidater:
${kandidatBeskrivelser}

Svar med JSON-array (ingen annen tekst). Hvert element:
{"id": "k1", "poeng": 85, "begrunnelse": "Kort forklaring på norsk (maks 2 setninger)"}

Ranger fra best til dårligst. Poeng 0-100.`;

      let rangering: Array<{ id: string; poeng: number; begrunnelse: string }> = [];
      try {
        const aiRes = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: rangerPrompt }],
        });

        const aiTekst = aiRes.content[0].type === "text" ? aiRes.content[0].text : "";
        // Extract JSON from response
        const jsonMatch = aiTekst.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rangering = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Claude ranking error:", e);
      }

      // Build final results
      const endeligeResultater = analyseResultater.map((r, i) => {
        const id = `k${i + 1}`;
        const rang = rangering.find((rg) => rg.id === id);
        return {
          id,
          lat: r.kandidat.lat,
          lon: r.kandidat.lon,
          adresse: r.adresse,
          arealformaal: r.kandidat.arealformaal,
          planNavn: r.kandidat.planNavn,
          analyseKort: r.kort,
          poeng: rang?.poeng ?? 50,
          begrunnelse: rang?.begrunnelse ?? "Ingen AI-vurdering tilgjengelig",
        };
      });

      // Sort by score descending
      endeligeResultater.sort((a, b) => b.poeng - a.poeng);

      const soketid = ((Date.now() - startTid) / 1000).toFixed(1);

      jsonLine(writer, {
        type: "ferdig",
        melding: `Fant ${endeligeResultater.length} aktuelle områder på ${soketid} sekunder`,
        resultater: endeligeResultater,
        soketidSekunder: parseFloat(soketid),
      });
    } catch (error: any) {
      console.error("Tomtefinner error:", error);
      jsonLine(writer, { type: "feil", melding: error.message || "Ukjent feil" });
    } finally {
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
