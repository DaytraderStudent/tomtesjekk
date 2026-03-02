export interface KartverketAdresse {
  adressetekst: string;
  poststed: string;
  postnummer: string;
  kommunenavn: string;
  kommunenummer: string;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
}

export type TrafikklysStatus = "gronn" | "gul" | "rod" | "gra";

export type KartlagId = "stoy" | "matrikkel" | "radon" | "losmasser" | "regulering";

export interface AnalyseKort {
  id: string;
  tittel: string;
  beskrivelse: string;
  detaljer: string;
  status: TrafikklysStatus;
  statusTekst: string;
  kilde: string;
  kildeUrl: string;
  raadata?: Record<string, any>;
}

export interface AiOppsummering {
  tekst: string;
  generert: string;
}

export interface Rapport {
  adresse: KartverketAdresse;
  kort: AnalyseKort[];
  aiOppsummering: AiOppsummering | null;
  hoydeOverHavet: number | null;
  kartBilde: string | null;
  kartBilder?: Record<string, string>;
  tidspunkt: string;
}

export type StegStatus = "venter" | "aktiv" | "ferdig" | "feil";

export interface AnalyseSteg {
  id: string;
  navn: string;
  status: StegStatus;
  feilmelding?: string;
}

export interface Fremdrift {
  steg: AnalyseSteg[];
  prosent: number;
  erFerdig: boolean;
}

export interface NveResultat {
  flom: {
    aktsomhetsomrade: boolean;
    faregrad?: string;
    detaljer?: string;
  };
  skred: {
    aktsomhetsomrade: boolean;
    skredtype?: string;
    detaljer?: string;
  };
  kvikkleire: {
    faresone: boolean;
    faregrad?: string;
    detaljer?: string;
  };
}

export interface NguRadonResultat {
  nivaaTekst: string;
  nivaa: "lav" | "moderat" | "hoy" | "ukjent";
  detaljer?: string;
}

export interface NguGrunnResultat {
  jordart: string;
  beskrivelse: string;
  detaljer?: string;
}

export interface SsbResultat {
  indeksverdi: number;
  periode: string;
  endringProsent: number;
  detaljer?: string;
}

export interface NvdbResultat {
  vegkategori: string;
  vegstatus: string;
  vegreferanse: string;
  avstand: number;
  detaljer?: string;
}

export interface EiendomResultat {
  kommunenummer: string;
  gardsnummer: number;
  bruksnummer: number;
  matrikkelnummertekst: string;
  arealKvm: number | null;
  grenseGeoJson: GeoJSON.Feature | null;
}

export interface StoyResultat {
  harStoy: boolean;
  nivaDb: number | null;
  enhet: string;
  kilde: string;
  detaljer?: string;
}

export interface BoligprisResultat {
  kommunenavn: string;
  aar: string;
  enebolig: number | null;
  smahus: number | null;
  blokk: number | null;
  detaljer?: string;
}

export interface KulturminneResultat {
  harKulturminner: boolean;
  minner: Array<{
    navn: string;
    kategori: string;
    vernetype: string;
    avstandMeter: number;
    lenke: string | null;
  }>;
  naermesteAvstandMeter: number | null;
  harFredning: boolean;
  detaljer?: string;
}

export interface SolbanePunkt {
  time: number;       // 0-23
  altitude: number;   // degrees
  azimuth: number;    // compass degrees (0=N, 90=E, 180=S, 270=W)
}

export interface SolforholdSesong {
  soloppgang: string;
  solnedgang: string;
  daglengdeTimer: number;
  solhoyde09: number;
  solhoyde12: number;
  solhoyde15: number;
  soloppgangRetning: string;   // "NØ", "Ø", etc.
  solnedgangRetning: string;   // "NV", "V", etc.
  bane: SolbanePunkt[];        // hourly sun positions
}

export interface SolforholdResultat {
  sommer: SolforholdSesong;
  vinter: SolforholdSesong;
  hovedretning: string;
  detaljer?: string;
}

export interface ReguleringsplanResultat {
  harPlan: boolean | null;
  planNavn: string | null;
  planType: string | null;
  arealformaal: string | null;
  planStatus: string | null;
  planId: string | null;
  detaljer?: string;
  utnyttingsgrad?: number | null;
  maksHoyde?: number | null;
  maksEtasjer?: number | null;
  utnyttelseKilde?: "plan" | "tek17";
}
