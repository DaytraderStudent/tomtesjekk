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
