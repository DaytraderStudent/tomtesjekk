import { NextRequest, NextResponse } from "next/server";
import { hentKlimaForKommune } from "@/lib/klima-data";
import { fetchWithTimeout } from "@/lib/api-helpers";
import type { KlimaProjeksjonResultat } from "@/types";

/**
 * Klimaprojeksjon for en norsk tomt.
 *
 * Returnerer projiserte endringer til 2100 under SSP5-8.5 (høye utslipp),
 * som er det scenariet DSB anbefaler kommuner å planlegge for.
 *
 * Data: Statiske autoritative verdier per fylke (Kartverket, NVE,
 * Klimaservicesenter). Supplert med tomtens høyde over havet for å
 * estimere om havstigning påvirker tomten direkte.
 */

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "0");
  const lon = parseFloat(request.nextUrl.searchParams.get("lon") || "0");
  const kommunenummer = request.nextUrl.searchParams.get("kommunenummer") || "";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Mangler koordinater" },
      { status: 400 }
    );
  }

  const klima = hentKlimaForKommune(kommunenummer);

  // Get elevation to determine sea level exposure
  let hoydeOverHavet: number | null = null;
  try {
    const res = await fetchWithTimeout(
      `https://ws.geonorge.no/hoydedata/v1/punkt?nord=${lat}&ost=${lon}&koordsys=4258`,
      {},
      6000
    );
    if (res.ok) {
      const data = await res.json();
      const h = data.punkter?.[0]?.z ?? data.z;
      if (typeof h === "number") hoydeOverHavet = Math.round(h);
    }
  } catch {}

  // Determine if the plot is exposed to sea level rise
  // DSB recommends planning for: +50 cm sea level + 150 cm storm surge buffer
  // = tomter under ca. 2 m over havet har direkte eksponering
  let havstigningRisiko: "ingen" | "lav" | "moderat" | "hoy" = "ingen";
  let havstigningKommentar = "Tomten ligger trygt i forhold til havnivåstigning.";

  if (klima.havstigning2100Cm && hoydeOverHavet != null) {
    const stigningM = klima.havstigning2100Cm / 100;
    const stormfloBuffer = 1.5; // m, typical storm surge allowance per DSB
    const kritiskHoyde = stigningM + stormfloBuffer;

    if (hoydeOverHavet < kritiskHoyde) {
      havstigningRisiko = "hoy";
      havstigningKommentar = `Tomten ligger ${hoydeOverHavet} moh. Med projisert havnivåstigning på ${klima.havstigning2100Cm} cm innen 2100 og stormflobuffer på 150 cm (DSBs anbefaling) er tomten i risikosonen for stormflo og oversvømmelse innen århundret.`;
    } else if (hoydeOverHavet < kritiskHoyde + 2) {
      havstigningRisiko = "moderat";
      havstigningKommentar = `Tomten ligger ${hoydeOverHavet} moh. Med projisert havnivåstigning på ${klima.havstigning2100Cm} cm innen 2100 er marginene til stormflonivå snevre. Vurder ekstra fundamentsikring.`;
    } else if (hoydeOverHavet < 10) {
      havstigningRisiko = "lav";
      havstigningKommentar = `Tomten ligger ${hoydeOverHavet} moh. Havnivåstigning på ${klima.havstigning2100Cm} cm innen 2100 påvirker ikke tomten direkte, men kan påvirke veiadkomst og infrastruktur i området.`;
    }
  } else if (!klima.havstigning2100Cm) {
    havstigningKommentar = "Tomten ligger i et innenlandsområde — havnivåstigning er ikke relevant direkte, men kan påvirke avrenning og vannstand i vassdrag.";
  }

  const result: KlimaProjeksjonResultat = {
    fylke: klima.fylke,
    scenario: "SSP5-8.5 (høye utslipp)",
    tidshorisont: "2100",
    havstigning: klima.havstigning2100Cm
      ? {
          verdiCm: klima.havstigning2100Cm,
          risikoNiva: havstigningRisiko,
          kommentar: havstigningKommentar,
          hoydeOverHavet,
        }
      : null,
    nedbor: {
      arligEndringProsent: klima.nedborEndringProsent,
      ekstremEndringProsent: klima.ekstremNedborOkningProsent,
      kommentar: `Årsnedbøren forventes å øke med ca. ${klima.nedborEndringProsent}% innen 2100. Ekstreme nedbørsepisoder (kraftigste døgn) øker med ca. ${klima.ekstremNedborOkningProsent}%. Dette gir økt belastning på drenering og overvannshåndtering.`,
    },
    flom: {
      okningProsent: klima.flomOkningProsent,
      kommentar: `200-års flomnivå forventes å øke med ca. ${klima.flomOkningProsent}% innen 2100 (NVE klimaframskriving). Tomter som i dag er akkurat utenfor flomsone kan havne innenfor med klimapåslaget.`,
    },
    kilde: klima.kilde,
    ansvarligInstansLenker: [
      {
        navn: "Kartverket – havnivå 2100",
        url: "https://www.kartverket.no/til-sjos/se-havniva",
      },
      {
        navn: "NVE – klima og flom",
        url: "https://www.nve.no/naturfare/naturfare-tema/flom/klima-og-flom/",
      },
      {
        navn: "Norsk klimaservicesenter",
        url: "https://klimaservicesenter.no",
      },
      {
        navn: "DSB – havnivåstigning veileder",
        url: "https://www.dsb.no",
      },
    ],
  };

  return NextResponse.json(result);
}
