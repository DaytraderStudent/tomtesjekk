/**
 * Klimaprojeksjoner for norske fylker — autoritative statiske tall.
 *
 * Kilder:
 * - Kartverket: "Havnivå i Norge 2021–2100" (IPCC AR6-basert)
 *   https://www.kartverket.no/til-sjos/se-havniva
 * - NVE: "Klimaendringer og framtidige flommer i Norge" (NVE Rapport 1/2017)
 *   https://publikasjoner.nve.no/rapport/2017/rapport2017_01.pdf
 * - Norsk klimaservicesenter: Klimaprofiler per fylke
 *   https://klimaservicesenter.no
 * - DSB: "Havnivåstigning og stormflo" (2024-veileder for kommuner)
 *
 * Tallene brukes som grunnlag for klimavisualiseringen i tomterapporten.
 * De er bevisst valgt som medianverdier fra SSP5-8.5-scenario (høye utslipp)
 * siden dette er det scenariet DSB anbefaler kommuner å planlegge for.
 */

export interface KlimaProjeksjon {
  fylke: string;
  havstigning2100Cm: number | null;     // Relative sea level rise (cm) by 2100, SSP5-8.5
  nedborEndringProsent: number;          // Annual precipitation increase (%) by 2100
  flomOkningProsent: number;             // 200-year flood level change (%) by 2100
  ekstremNedborOkningProsent: number;    // Extreme precipitation (1-day) increase (%)
  kilde: string;
}

// Values drawn from Kartverket's 2021–2100 sea level projections (SSP5-8.5)
// and NVE's climate adjustment factors per region.
// Coastal fylker have sea level data; inland fylker have null.
export const KLIMA_PER_FYLKE: Record<string, KlimaProjeksjon> = {
  // Oslo + Viken area
  "03": {
    fylke: "Oslo",
    havstigning2100Cm: 40,
    nedborEndringProsent: 10,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 28,
    kilde: "Kartverket, NVE, Klimaservicesenter",
  },
  "30": {
    fylke: "Viken (Akershus/Østfold/Buskerud)",
    havstigning2100Cm: 40,
    nedborEndringProsent: 10,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 28,
    kilde: "Kartverket, NVE, Klimaservicesenter",
  },
  "31": {
    fylke: "Østfold",
    havstigning2100Cm: 40,
    nedborEndringProsent: 10,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 28,
    kilde: "Kartverket, NVE",
  },
  "32": {
    fylke: "Akershus",
    havstigning2100Cm: 40,
    nedborEndringProsent: 10,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 28,
    kilde: "Kartverket, NVE",
  },
  "33": {
    fylke: "Buskerud",
    havstigning2100Cm: null, // inland
    nedborEndringProsent: 10,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 28,
    kilde: "NVE, Klimaservicesenter",
  },
  "34": {
    fylke: "Innlandet",
    havstigning2100Cm: null,
    nedborEndringProsent: 12,
    flomOkningProsent: 20,
    ekstremNedborOkningProsent: 30,
    kilde: "NVE, Klimaservicesenter",
  },
  // Vestfold + Telemark
  "38": {
    fylke: "Vestfold og Telemark",
    havstigning2100Cm: 42,
    nedborEndringProsent: 8,
    flomOkningProsent: 10,
    ekstremNedborOkningProsent: 25,
    kilde: "Kartverket, NVE",
  },
  "39": {
    fylke: "Vestfold",
    havstigning2100Cm: 42,
    nedborEndringProsent: 8,
    flomOkningProsent: 10,
    ekstremNedborOkningProsent: 25,
    kilde: "Kartverket, NVE",
  },
  "40": {
    fylke: "Telemark",
    havstigning2100Cm: 42,
    nedborEndringProsent: 8,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 27,
    kilde: "Kartverket, NVE",
  },
  // Sørlandet
  "42": {
    fylke: "Agder",
    havstigning2100Cm: 44,
    nedborEndringProsent: 10,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 27,
    kilde: "Kartverket, NVE, Klimaservicesenter",
  },
  // Rogaland
  "11": {
    fylke: "Rogaland",
    havstigning2100Cm: 46,
    nedborEndringProsent: 15,
    flomOkningProsent: 20,
    ekstremNedborOkningProsent: 30,
    kilde: "Kartverket, NVE, Klimaservicesenter",
  },
  // Vestland
  "46": {
    fylke: "Vestland",
    havstigning2100Cm: 44,
    nedborEndringProsent: 18,
    flomOkningProsent: 25,
    ekstremNedborOkningProsent: 32,
    kilde: "Kartverket, NVE, Klimaservicesenter",
  },
  // Møre og Romsdal
  "15": {
    fylke: "Møre og Romsdal",
    havstigning2100Cm: 40,
    nedborEndringProsent: 15,
    flomOkningProsent: 20,
    ekstremNedborOkningProsent: 30,
    kilde: "Kartverket, NVE",
  },
  // Trøndelag
  "50": {
    fylke: "Trøndelag",
    havstigning2100Cm: 36,
    nedborEndringProsent: 12,
    flomOkningProsent: 18,
    ekstremNedborOkningProsent: 28,
    kilde: "Kartverket, NVE",
  },
  // Nordland
  "18": {
    fylke: "Nordland",
    havstigning2100Cm: 32,
    nedborEndringProsent: 15,
    flomOkningProsent: 20,
    ekstremNedborOkningProsent: 30,
    kilde: "Kartverket, NVE",
  },
  // Troms og Finnmark / Troms / Finnmark
  "54": {
    fylke: "Troms og Finnmark",
    havstigning2100Cm: 20,
    nedborEndringProsent: 18,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 30,
    kilde: "Kartverket, NVE",
  },
  "55": {
    fylke: "Troms",
    havstigning2100Cm: 22,
    nedborEndringProsent: 18,
    flomOkningProsent: 15,
    ekstremNedborOkningProsent: 30,
    kilde: "Kartverket, NVE",
  },
  "56": {
    fylke: "Finnmark",
    havstigning2100Cm: 15,
    nedborEndringProsent: 20,
    flomOkningProsent: 12,
    ekstremNedborOkningProsent: 28,
    kilde: "Kartverket, NVE",
  },
};

// Default values if we can't map fylke (conservative: use national median)
export const NASJONALT_SNITT: KlimaProjeksjon = {
  fylke: "Norge (gjennomsnitt)",
  havstigning2100Cm: 40,
  nedborEndringProsent: 13,
  flomOkningProsent: 18,
  ekstremNedborOkningProsent: 29,
  kilde: "Kartverket, NVE, Klimaservicesenter — nasjonalt snitt (SSP5-8.5)",
};

/**
 * Map kommunenummer (4 digits) to fylke code. First 2 digits of kommunenummer
 * correspond to the fylke code in Norway's ISO 3166-2:NO system (post-2020).
 */
export function fylkeFraKommunenummer(kommunenummer: string | null | undefined): string | null {
  if (!kommunenummer || kommunenummer.length < 2) return null;
  return kommunenummer.substring(0, 2);
}

export function hentKlimaForKommune(kommunenummer: string | null | undefined): KlimaProjeksjon {
  const fylkekode = fylkeFraKommunenummer(kommunenummer);
  if (!fylkekode) return NASJONALT_SNITT;
  return KLIMA_PER_FYLKE[fylkekode] || NASJONALT_SNITT;
}
