"use client";

import { ExternalLink, Info, Building2, Ruler, Layers, BadgePercent, MapPin, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusFarge, statusLabel } from "@/lib/trafikklys";
import { hentKortIkon } from "@/lib/kort-ikoner";
import type { AnalyseKort } from "@/types";

const FORKLARINGER: Record<string, string> = {
  flom:
    "Flomfare viser om eiendommen ligger i et aktsomhetsområde for flom basert på NVEs kartdata. " +
    "Høy risiko betyr at området kan bli oversvømt ved store nedbørsmengder eller snøsmelting. " +
    "Sjekk om kommunen har gjennomført flomsikringstiltak i området.",
  skred:
    "Skredfare dekker snøskred, jordskred og steinsprang. NVE kartlegger aktsomhetsområder " +
    "basert på terrenghelning, løsmasser og historiske hendelser. Byggetiltak i skredutsatte " +
    "områder kan kreve ekstra geotekniske undersøkelser og sikringstiltak.",
  kvikkleire:
    "Kvikkleire er leire som kan bli flytende ved forstyrrelse. NVE kartlegger faresoner " +
    "basert på grunnboringer og terrenganalyser. Bygging i kvikkleireområder krever " +
    "geoteknisk vurdering og kan medføre ekstra fundamenteringskostnader.",
  radon:
    "Radon er en radioaktiv gass fra berggrunnen som kan samle seg i bygninger. " +
    "NGU klassifiserer radonrisiko basert på berggrunnstype. Ved moderat eller høy risiko " +
    "bør radonsperre eller ventilasjon inkluderes i byggeplanene. Målinger anbefales.",
  grunn:
    "Grunnforhold beskriver jordarten på tomten. Fjell og morene gir stabil byggegrunn, " +
    "mens leire, torv og myr kan kreve ekstra fundamentering (peling, masseutskifting). " +
    "Grunnforhold påvirker byggekostnader og mulighet for kjeller.",
  eiendom:
    "Eiendomsinformasjon viser matrikkeldata (gårds- og bruksnummer) og tomteareal " +
    "fra Kartverkets eiendomsregister. Arealet er beregnet fra digitale grensepunkt " +
    "og kan avvike noe fra tinglyste mål.",
  regulering:
    "Reguleringsplanen viser hva tomten er regulert til (bolig, næring, friområde etc.) og " +
    "eventuell tillatt utnyttelsesgrad (BYA%), byggehøyde og antall etasjer. " +
    "Verdier merket «fra plandata» er hentet fra DiBK. Verdier merket «veiledende» er " +
    "TEK17-referanseverdier basert på arealformål — de faktiske bestemmelsene kan avvike. " +
    "Sjekk alltid kommunens planinnsyn for bindende reguleringsbestemmelser.",
  ssb:
    "Byggekostnadsindeksen fra SSB måler prisutviklingen på materialer og arbeid for boligbygging. " +
    "En stigende indeks betyr høyere byggepriser. Den estimerte kr/m²-prisen er et landsgjennomsnitt " +
    "og vil variere med standard, tomteforhold og region.",
  nvdb:
    "Veitilgang viser avstand til nærmeste offentlige vei fra NVDB (Nasjonal vegdatabank). " +
    "Kort avstand gir enklere adkomst for bygging og beboelse. Lang avstand kan bety " +
    "behov for privat vei, som øker kostnadene.",
  stoy:
    "Støynivået er hentet fra Statens vegvesens støykartlegging og viser veitrafikkstøy i desibel. " +
    "Under 55 dB regnes som stille. Over 65 dB anbefales støyisolering. " +
    "Støykrav stilles ved søknad om bygging nær trafikkerte veier.",
  boligpris:
    "Boligpriser fra SSB viser gjennomsnittlig kvadratmeterpris for ulike boligtyper i kommunen. " +
    "Prisene gir en indikasjon på boligmarkedets verdi i området, men varierer " +
    "betydelig med beliggenhet, standard og tomteforhold innad i kommunen.",
  kulturminner:
    "Kulturminner er bygninger, anlegg og områder registrert i Riksantikvarens Askeladden-database. " +
    "Fredede kulturminner har strengt juridisk vern — tiltak som berører et fredet kulturminne krever " +
    "dispensasjon fra Riksantikvaren. Kulturminner i nærheten kan påvirke byggesaken gjennom " +
    "hensynssoner i reguleringsplanen.",
  solforhold:
    "Solforhold beregnes astronomisk ut fra koordinater og viser teoretisk daglengde og solhøyde " +
    "gjennom året. Beregningen tar ikke hensyn til terreng, bygninger eller vegetasjon som kan skygge. " +
    "For nøyaktig solanalyse bør det gjøres en skyggestudie med 3D-terrengmodell.",
};

interface Props {
  kort: AnalyseKort;
}

export function DetaljerKategori({ kort }: Props) {
  const { icon: Icon, farge: ikonFarge } = hentKortIkon(kort.id);
  const farge = statusFarge(kort.status);
  const label = statusLabel(kort.status);
  const forklaring = FORKLARINGER[kort.id];

  return (
    <section
      id={`kategori-${kort.id}`}
      className="detaljer-kategori scroll-mt-32 lg:scroll-mt-24 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:break-inside-avoid"
    >
      {/* Colored top line */}
      <div className="h-1.5" style={{ backgroundColor: farge }} />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: icon + title + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ikonFarge}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: ikonFarge }} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">
                {kort.tittel}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">{kort.beskrivelse}</p>
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            )}
            style={{
              backgroundColor: `${farge}18`,
              color: farge,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: farge }}
            />
            {label}
          </span>
        </div>

        {/* Details */}
        {kort.detaljer && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {kort.detaljer}
            </p>
          </div>
        )}

        {/* Structured BYA subsection for regulering */}
        {kort.id === "regulering" && kort.raadata?.utnyttingsgrad != null && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Utnyttelse og byggehøyde
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                  kort.raadata.utnyttelseKilde === "plan"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {kort.raadata.utnyttelseKilde === "plan"
                  ? "Fra plandata"
                  : "Veiledende"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {kort.raadata.utnyttingsgrad != null && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BadgePercent className="w-3.5 h-3.5 text-fjord-500" />
                    <span className="text-xs text-gray-500">Maks BYA</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.utnyttingsgrad}%
                  </p>
                </div>
              )}

              {kort.raadata.maksBebyggetAreal != null && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-fjord-500" />
                    <span className="text-xs text-gray-500">Maks bebygd</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.maksBebyggetAreal} m²
                  </p>
                </div>
              )}

              {kort.raadata.maksHoyde != null && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-fjord-500" />
                    <span className="text-xs text-gray-500">Maks høyde</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.maksHoyde} m
                  </p>
                </div>
              )}

              {kort.raadata.maksEtasjer != null && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-fjord-500" />
                    <span className="text-xs text-gray-500">Maks etasjer</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.maksEtasjer}
                  </p>
                </div>
              )}
            </div>

            {kort.raadata.utnyttelseKilde === "tek17" && (
              <p className="text-xs text-amber-600 leading-relaxed">
                Verdiene er veiledende TEK17-referanser basert på arealformålet og er ikke bindende.
                Faktisk tillatt utnyttelse kan avvike — sjekk kommunens reguleringsbestemmelser.
              </p>
            )}
          </div>
        )}

        {/* Structured kulturminner view */}
        {kort.id === "kulturminner" && kort.raadata?.minner && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Registrerte kulturminner
            </p>
            <div className="space-y-2">
              {(kort.raadata.minner as Array<{ navn: string; kategori: string; vernetype: string; avstandMeter: number; lenke: string | null }>).map(
                (m, i) => {
                  const vLow = (m.vernetype || "").toLowerCase();
                  const erFredet =
                    vLow.includes("vedtaksfredet") ||
                    vLow.includes("forskriftsfredet") ||
                    vLow.includes("automatisk fredet");
                  const erListefort = vLow.includes("listeført") || vLow.includes("kommunalt");

                  return (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-3 border border-gray-100 flex items-start gap-3"
                    >
                      <MapPin className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {m.navn}
                          </span>
                          {m.vernetype && (
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                                erFredet
                                  ? "bg-red-100 text-red-700"
                                  : erListefort
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {m.vernetype}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {m.kategori && <span>{m.kategori}</span>}
                          <span>{m.avstandMeter} m unna</span>
                        </div>
                        {m.lenke && (
                          <a
                            href={m.lenke}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-fjord-500 hover:text-fjord-700 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Se i Kulturminnesøk
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Structured solforhold view */}
        {kort.id === "solforhold" && kort.raadata?.sommer && kort.raadata?.vinter && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Solforhold sommer vs. vinter
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Sommer */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-700">Sommer (21. juni)</p>
                <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Soloppgang</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.sommer.soloppgang}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Solnedgang</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.sommer.solnedgang}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daglengde</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.sommer.daglengdeTimer} t</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Solhøyde kl 12
                    </span>
                    <span className="font-semibold text-gray-900">{kort.raadata.sommer.solhoyde12}°</span>
                  </div>
                </div>
              </div>
              {/* Vinter */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-700">Vinter (21. des)</p>
                <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Soloppgang</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.vinter.soloppgang}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Solnedgang</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.vinter.solnedgang}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daglengde</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.vinter.daglengdeTimer} t</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-blue-400" />
                      Solhøyde kl 12
                    </span>
                    <span className="font-semibold text-gray-900">{kort.raadata.vinter.solhoyde12}°</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Hovedretning badge */}
            {kort.raadata.hovedretning && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Hovedsolretning:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                  <Sun className="w-3 h-3" />
                  {kort.raadata.hovedretning}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Raw data — hide for regulering when structured BYA data is shown, and hide for kulturminner */}
        {kort.raadata && Object.keys(kort.raadata).length > 0 &&
          !(kort.id === "regulering" && kort.raadata.utnyttingsgrad != null) &&
          kort.id !== "kulturminner" &&
          kort.id !== "solforhold" && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Rådata
            </p>
            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-words">
              {JSON.stringify(kort.raadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Explanation */}
        {forklaring && (
          <div className="bg-fjord-50 border border-fjord-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-fjord-500" />
              <span className="text-sm font-semibold text-fjord-700">
                Hva betyr dette?
              </span>
            </div>
            <p className="text-sm text-fjord-700 leading-relaxed">
              {forklaring}
            </p>
          </div>
        )}

        {/* Source link */}
        {kort.kildeUrl && (
          <a
            href={kort.kildeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-fjord-500 hover:text-fjord-700 transition-colors print:hidden"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Kilde: {kort.kilde}
          </a>
        )}
      </div>
    </section>
  );
}
