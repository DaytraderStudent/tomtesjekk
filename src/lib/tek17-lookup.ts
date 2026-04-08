/**
 * TEK17-lookup: autoritative paragrafer koblet til analysefunn.
 *
 * Denne tabellen erstatter en full RAG-pipeline med en håndkuratert liste
 * av de vanligste paragrafene i TEK17 (Byggteknisk forskrift) og tilknyttede
 * NVE-/PBL-henvisninger. Hver oppføring brukes i rapport-endepunktet:
 *
 *   1. Når et analysekort matcher en kjent tilstand (f.eks. "moderat radon"),
 *      hentes paragraf + tekst + lenke + konsekvens.
 *   2. Disse legges inn i prompten som "AUTORITATIVE KILDER Å SITERE".
 *   3. AI pålegges å sitere paragrafnummer eksplisitt i rapporten.
 *
 * Resultat: rapporten får juridisk forankring og er transparent —
 * brukeren kan klikke seg videre til original-teksten hos DiBK/NVE.
 */

export interface Tek17Entry {
  paragraf: string;
  tittel: string;
  tekst: string;
  lenke: string;
  konsekvens: string;
}

export const TEK17_LOOKUP: Record<string, Tek17Entry> = {
  // --- Radon ---
  radon_moderat: {
    paragraf: "TEK17 §13-5",
    tittel: "Radon",
    tekst:
      "Bygning beregnet for varig opphold skal ha så lave radonkonsentrasjoner som praktisk mulig. Årsmiddelverdien skal ikke overstige 200 Bq/m³.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/13/ii/13-5/",
    konsekvens:
      "Radonsperre og tilrettelegging for senere radonbrønn/ventilasjonstiltak er påkrevd for nybygg med varig opphold.",
  },
  radon_hoy: {
    paragraf: "TEK17 §13-5",
    tittel: "Radon",
    tekst:
      "Bygning beregnet for varig opphold skal ha så lave radonkonsentrasjoner som praktisk mulig. Årsmiddelverdien skal ikke overstige 200 Bq/m³. Ved høy radonrisiko kreves forsterkede tiltak.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/13/ii/13-5/",
    konsekvens:
      "Tettebane (radonsperre) og aktivt ventilasjonssystem er typisk nødvendig. Dokumentasjon på effekt av tiltak må foreligge før ferdigattest.",
  },

  // --- Flom ---
  flom_aktsomhet: {
    paragraf: "TEK17 §7-2",
    tittel: "Sikkerhet mot flom og stormflo",
    tekst:
      "Byggverk hvor konsekvensen av en flom er liten, skal plasseres, dimensjoneres eller sikres mot flom slik at største nominelle årlige sannsynlighet ikke overstiger 1/200 (F2).",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/7/ii/7-2/",
    konsekvens:
      "Gulvnivå må typisk plasseres over 200-års flomnivå, eller aktive flomsikringstiltak må dokumenteres. Fagkyndig vurdering er påkrevd.",
  },

  // --- Skred / kvikkleire ---
  skred_aktsomhet: {
    paragraf: "TEK17 §7-3",
    tittel: "Sikkerhet mot skred",
    tekst:
      "Byggverk hvor konsekvensen av et skred er særlig stor, skal ikke plasseres i skredfarlig område. Sikkerhet mot skred skal minst tilsvare sikkerhetsklasse S2 (nominell årlig sannsynlighet 1/1000).",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/7/ii/7-3/",
    konsekvens:
      "Geoteknisk fagkyndig må dokumentere at bygging er forsvarlig. Det kan være nødvendig med sikringstiltak eller fraflytning av skredutsatte partier.",
  },
  kvikkleire: {
    paragraf: "NVE-veileder 1/2019 + TEK17 §7-3",
    tittel: "Kvikkleire og områdestabilitet",
    tekst:
      "I områder med påvist eller potensiell kvikkleire skal områdestabilitet dokumenteres før tiltak kan gjennomføres. NVEs veileder gir prosedyre for nødvendig geoteknisk utredning.",
    lenke: "https://publikasjoner.nve.no/veileder/2019/veileder2019_01.pdf",
    konsekvens:
      "Geoteknisk fagkyndig må dokumentere områdestabilitet i henhold til NVE-veileder 1/2019. Prosessen kan ta flere måneder og kan gi rammer for tillatt byggeomfang.",
  },

  // --- Støy ---
  stoy_gul: {
    paragraf: "TEK17 §13-6 + T-1442",
    tittel: "Lydforhold og støy",
    tekst:
      "Byggverk skal ha slik lydisolasjon og avskjerming mot støy at det oppnås tilfredsstillende lydforhold. Miljøverndepartementets retningslinje T-1442 gir grenseverdier for støy.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/13/iii/13-6/",
    konsekvens:
      "I gul støysone (Lden 55-65 dB) kreves typisk støytiltak på fasade, støyskjerming av uteoppholdsareal og stille side på soverom.",
  },
  stoy_rod: {
    paragraf: "TEK17 §13-6 + T-1442",
    tittel: "Lydforhold og støy",
    tekst:
      "I rød støysone (Lden over 65 dB) er ny bebyggelse som hovedregel ikke tillatt. Dispensasjon krever avbøtende tiltak og dokumentasjon.",
    lenke: "https://www.regjeringen.no/no/dokumenter/t-1442-retningslinje-for-behandling-av-stoy-i-arealplanlegging/id2439353/",
    konsekvens:
      "Bygging i rød sone er som hovedregel ikke tillatt. Dispensasjon kan kreve fasadetiltak, stille side, støyskjerm og plankrav.",
  },

  // --- Grunnforhold ---
  grunn_leire: {
    paragraf: "TEK17 §7-3 + §10-2",
    tittel: "Grunnforhold og fundamentering",
    tekst:
      "Byggverk skal prosjekteres og utføres slik at det oppnås tilfredsstillende sikkerhet mot brudd, skade og deformasjoner. Fundamenter skal tilpasses grunnforholdene.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/10/10-2/",
    konsekvens:
      "På leirgrunn kan det være behov for peling, kalkstabilisering eller masseutskifting. Geoteknisk rapport bør innhentes før kjøp.",
  },
  grunn_myr_torv: {
    paragraf: "TEK17 §10-2",
    tittel: "Fundamentering på organisk grunn",
    tekst:
      "Fundamenter skal dimensjoneres etter grunnens bæreevne. Organiske jordarter (torv, myr) gir store setninger og krever spesielle løsninger.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/10/10-2/",
    konsekvens:
      "Typisk nødvendig med peling til fast grunn eller betydelig masseutskifting. Kostnadene varierer sterkt — innhent geoteknisk vurdering før kjøp.",
  },

  // --- Kulturminner ---
  kulturminne_nær: {
    paragraf: "Kulturminneloven §§ 4, 8, 15a",
    tittel: "Kulturminner og fredning",
    tekst:
      "Tiltak som kan virke inn på automatisk fredede kulturminner er forbudt uten tillatelse fra kulturmiljømyndigheten. Dette gjelder også i en sikringssone rundt kulturminnet.",
    lenke: "https://lovdata.no/dokument/NL/lov/1978-06-09-50",
    konsekvens:
      "Byggeplan må legges fram for fylkeskommunen eller Riksantikvaren. Arkeologisk registrering kan være påkrevd før tiltak. Kan gi krav om omprosjektering.",
  },

  // --- Vassdrag / byggegrense ---
  vassdrag: {
    paragraf: "Plan- og bygningsloven §1-8",
    tittel: "Byggegrense mot vassdrag",
    tekst:
      "I 100-metersbeltet langs sjøen og langs vassdrag er det byggeforbud der ikke annet er bestemt i kommuneplan eller reguleringsplan.",
    lenke: "https://lovdata.no/dokument/NL/lov/2008-06-27-71/§1-8",
    konsekvens:
      "Bygging nær vassdrag krever typisk dispensasjon eller må holde seg utenfor byggegrensa fastsatt i reguleringsplanen.",
  },

  // --- Uregulert område ---
  uregulert: {
    paragraf: "PBL §12-1 + kommuneplan",
    tittel: "Uregulerte områder",
    tekst:
      "For områder uten reguleringsplan gjelder kommuneplanens arealdel. Tiltak må være i tråd med arealformål, og det kan kreves områderegulering før større tiltak gjennomføres.",
    lenke: "https://lovdata.no/dokument/NL/lov/2008-06-27-71/§12-1",
    konsekvens:
      "Tomten kan være vanskelig å bebygge uten at det gjennomføres en reguleringsprosess. Kontakt kommunen tidlig for å avklare rammer og prosess.",
  },

  // --- Utnyttelsesgrad / BYA ---
  bya: {
    paragraf: "TEK17 §5 + NS 3940",
    tittel: "Grad av utnytting",
    tekst:
      "Grad av utnytting fastsettes i reguleringsplan som BYA (%-bebygd areal), BRA (bruksareal) eller %-BYA. Arealberegning følger NS 3940.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/5/",
    konsekvens:
      "Maksimalt tillatt bebygd areal begrenses av reguleringsplanens utnyttelsesgrad. Overskridelse krever dispensasjon.",
  },

  // --- Tilgjengelighet / universell utforming ---
  tilgjengelighet: {
    paragraf: "TEK17 §12-1 til §12-9",
    tittel: "Tilgjengelighet og universell utforming",
    tekst:
      "Boligbygg med krav om heis skal ha tilgjengelig boenhet. Alle inngangsparti skal være trinnfritt og allment tilgjengelig.",
    lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/12/",
    konsekvens:
      "Krav til trinnfri adkomst, snusirkler for rullestol, og tilgjengelige bad. Kan påvirke tomtedisponering på bratte tomter.",
  },
};

/**
 * Mapper analysefunn fra rapporten til relevante TEK17-paragrafer.
 * Returnerer en liste av paragrafer som bør siteres i rapporten.
 */
export function finnRelevanteTek17(analysedata: Array<{ kategori: string; status: string; detaljer?: string }>): Tek17Entry[] {
  const relevante: Tek17Entry[] = [];
  const seen = new Set<string>();

  const addIfNew = (key: string) => {
    const entry = TEK17_LOOKUP[key];
    if (entry && !seen.has(entry.paragraf)) {
      relevante.push(entry);
      seen.add(entry.paragraf);
    }
  };

  for (const kort of analysedata) {
    const kategori = kort.kategori.toLowerCase();
    const status = (kort.status || "").toLowerCase();
    const detaljer = (kort.detaljer || "").toLowerCase();
    const samlet = `${kategori} ${status} ${detaljer}`;

    // Radon
    if (kategori.includes("radon")) {
      if (samlet.includes("høy")) addIfNew("radon_hoy");
      else if (samlet.includes("moderat") || samlet.includes("gul")) addIfNew("radon_moderat");
    }

    // Flom
    if (kategori.includes("flom") && (samlet.includes("aktsomhet") || samlet.includes("område"))) {
      addIfNew("flom_aktsomhet");
    }

    // Skred
    if (kategori.includes("skred") && samlet.includes("aktsomhet")) {
      addIfNew("skred_aktsomhet");
    }

    // Kvikkleire
    if (kategori.includes("kvikk") && !samlet.includes("ingen") && !samlet.includes("ikke")) {
      addIfNew("kvikkleire");
    }

    // Støy
    if (kategori.includes("støy")) {
      if (samlet.includes("høy") || samlet.match(/[6-9]\d\s*db/)) addIfNew("stoy_rod");
      else if (samlet.includes("merkbar") || samlet.includes("gul") || samlet.match(/5[5-9]\s*db/)) addIfNew("stoy_gul");
    }

    // Grunnforhold
    if (kategori.includes("grunn")) {
      if (samlet.includes("myr") || samlet.includes("torv")) addIfNew("grunn_myr_torv");
      else if (samlet.includes("leire") || samlet.includes("marin")) addIfNew("grunn_leire");
    }

    // Kulturminne
    if (kategori.includes("kultur") && !samlet.includes("ingen")) {
      addIfNew("kulturminne_nær");
    }

    // Reguleringsplan
    if (kategori.includes("regulering")) {
      if (samlet.includes("uregulert") || samlet.includes("ingen")) {
        addIfNew("uregulert");
      } else if (samlet.includes("bya") || samlet.includes("utnytt")) {
        addIfNew("bya");
      }
    }
  }

  return relevante;
}
