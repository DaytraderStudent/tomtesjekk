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

export interface AiStrukturertFlagg {
  tema: string;
  beskrivelse: string;
  paragraf?: string;
  paragrafLenke?: string;
  anbefaling: string;
}

export interface AiStrukturertKostnad {
  tiltak: string;
  intervallKr: string;
  usikkerhet: "lav" | "middels" | "hoy";
  begrunnelse?: string;
}

export interface AiStrukturertRapport {
  oppsummering: string;
  rodeFlagg: AiStrukturertFlagg[];
  positiveFunn: string[];
  kostnadsfordyrende: AiStrukturertKostnad[];
  nesteSteg: string[];
  disclaimer: string;
}

export interface AiOppsummering {
  tekst: string;
  generert: string;
  strukturert?: AiStrukturertRapport;
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

// --- Klimaprojeksjon ---

export interface KlimaProjeksjonResultat {
  fylke: string;
  scenario: string;
  tidshorisont: string;
  havstigning: {
    verdiCm: number;
    risikoNiva: "ingen" | "lav" | "moderat" | "hoy";
    kommentar: string;
    hoydeOverHavet: number | null;
  } | null;
  nedbor: {
    arligEndringProsent: number;
    ekstremEndringProsent: number;
    kommentar: string;
  };
  flom: {
    okningProsent: number;
    kommentar: string;
  };
  kilde: string;
  ansvarligInstansLenker: Array<{ navn: string; url: string }>;
}

// --- VA-tilknytning ---

export interface VaTilknytningResultat {
  status: TrafikklysStatus;
  estimertAvstand: number | null;
  forklaring: string;
  kostnadIndikasjon: string;
  kilder: string[];
}

// --- Tomtefinner types ---

export interface TomtefinnerKriterier {
  kommunenummer: string;
  kommunenavn: string;
  bygningstype: "enebolig" | "rekkehus" | "blokk" | "naering" | "hytte" | "annet";
  virksomhetstype?: string;
  arealMin?: number;
  arealMax?: number;
  etasjer?: number;
  budsjettMin?: number;
  budsjettMax?: number;
  preferanser: TomtefinnerPreferanser;
}

export interface TomtefinnerPreferanser {
  solretning?: "sor" | "vest" | "ost" | "likegyldig";
  terreng?: "flatt" | "slakt" | "likegyldig";
  veinaerhet?: boolean;
  stille?: boolean;
  lavRisiko?: boolean;
}

export interface KandidatOmraade {
  id: string;
  lat: number;
  lon: number;
  arealformaal: string;
  planNavn: string | null;
  kommunenummer: string;
}

export interface TomtefinnerResultat {
  id: string;
  kandidat: KandidatOmraade;
  analyseKort: AnalyseKort[];
  poeng: number;
  begrunnelse: string;
  adresseTekst: string;
}

export interface TomtefinnerSokeresultat {
  kriterier: TomtefinnerKriterier;
  kandidater: TomtefinnerResultat[];
  aiOppsummering: string;
  soketidSekunder: number;
  tidspunkt: string;
}

// --- Reguleringsplan types ---

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
