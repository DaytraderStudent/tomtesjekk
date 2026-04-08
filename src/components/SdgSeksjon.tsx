"use client";

import { Globe } from "lucide-react";

/**
 * FNs bærekraftsmål — kobling fra tomtesjekk til konkrete SDG-er.
 *
 * Verktøyet adresserer SDG 11 (bærekraftige byer) og SDG 13 (klimatiltak)
 * ved å demokratisere tilgang til autoritative byggedata, flagge natur-
 * og klimarisiko tidlig i kjøpsprosessen, og redusere tap fra katastrofer
 * gjennom informert tomtevurdering.
 */

const SDG_MAAL = [
  {
    nummer: "11.3",
    tittel: "Inkluderende og bærekraftig urbanisering",
    beskrivelse:
      "Verktøyet demokratiserer tilgang til autoritativ byggedata som tidligere krevde fagekspertise, og gjør det mulig for privatpersoner å delta i beslutninger om hvor og hvordan det bygges.",
    farge: "from-amber-400 to-amber-500",
    bgFarge: "bg-amber-50 border-amber-200",
    tekstFarge: "text-amber-800",
  },
  {
    nummer: "11.5",
    tittel: "Redusere tap fra katastrofer",
    beskrivelse:
      "Automatisk flagging av flom-, skred- og kvikkleirerisiko før tomtekjøp gjør at feilinvesteringer og utsatt bebyggelse kan unngås. Dette er en konkret respons på Gjerdrum-skredet (2020).",
    farge: "from-amber-500 to-orange-500",
    bgFarge: "bg-orange-50 border-orange-200",
    tekstFarge: "text-orange-800",
  },
  {
    nummer: "13.1",
    tittel: "Klimatilpasning",
    beskrivelse:
      "Klimaprojeksjoner mot 2100 (havstigning, endret nedbørsmønster, endret flomnivå) integreres i tomtevurderingen slik at klimaperspektivet tas med i byggbeslutninger tidlig.",
    farge: "from-emerald-500 to-green-600",
    bgFarge: "bg-emerald-50 border-emerald-200",
    tekstFarge: "text-emerald-800",
  },
];

export function SdgSeksjon() {
  return (
    <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-200 bg-gradient-to-r from-sky-100/70 to-blue-100/50">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-sky-900">FNs bærekraftsmål</h3>
        </div>
        <p className="text-[11px] text-sky-700 mt-0.5">
          Slik bidrar tomtesjekk til FNs bærekraftsmål for 2030.
        </p>
      </div>

      <div className="p-4 space-y-2">
        {SDG_MAAL.map((maal) => (
          <div
            key={maal.nummer}
            className={`rounded-lg border p-3 ${maal.bgFarge}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-md bg-gradient-to-br ${maal.farge} flex flex-col items-center justify-center text-white shrink-0 shadow-sm`}
              >
                <div className="text-[9px] font-medium leading-none">SDG</div>
                <div className="text-lg font-bold leading-none">{maal.nummer}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold ${maal.tekstFarge}`}>
                  {maal.tittel}
                </h4>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                  {maal.beskrivelse}
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-1">
          <a
            href="https://sdgs.un.org/goals"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-sky-600 hover:text-sky-700 hover:underline"
          >
            → Les mer om FNs 17 bærekraftsmål på sdgs.un.org
          </a>
        </div>
      </div>
    </div>
  );
}
