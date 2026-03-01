"use client";

import { ExternalLink, Info } from "lucide-react";
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
    "Reguleringsplanen viser hva tomten er regulert til (bolig, næring, friområde etc.). " +
    "Uregulerte tomter kan kreve egen reguleringsplan før bygging tillates. " +
    "Sjekk kommunens planinnsyn for detaljer om utnyttelsesgrad og byggehøyde.",
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
      className="scroll-mt-32 lg:scroll-mt-24 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:break-inside-avoid"
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
            <p className="text-sm text-gray-700 leading-relaxed">
              {kort.detaljer}
            </p>
          </div>
        )}

        {/* Raw data */}
        {kort.raadata && Object.keys(kort.raadata).length > 0 && (
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
