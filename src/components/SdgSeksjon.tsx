"use client";

const SDG_MAAL = [
  {
    nummer: "11.3",
    tittel: "Inkluderende og bærekraftig urbanisering",
    beskrivelse:
      "Verktøyet demokratiserer tilgang til autoritativ byggedata som tidligere krevde fagekspertise, og gjør det mulig for privatpersoner å delta i beslutninger om hvor og hvordan det bygges.",
  },
  {
    nummer: "11.5",
    tittel: "Redusere tap fra katastrofer",
    beskrivelse:
      "Automatisk flagging av flom-, skred- og kvikkleirerisiko før tomtekjøp gjør at feilinvesteringer og utsatt bebyggelse kan unngås. Dette er en konkret respons på Gjerdrum-skredet (2020).",
  },
  {
    nummer: "13.1",
    tittel: "Klimatilpasning",
    beskrivelse:
      "Klimaprojeksjoner mot 2100 (havstigning, endret nedbørsmønster, endret flomnivå) integreres i tomtevurderingen slik at klimaperspektivet tas med i byggbeslutninger tidlig.",
  },
];

export function SdgSeksjon() {
  return (
    <section className="fade-up">
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-paper-edge">
        <div>
          <span className="label-editorial">Rammeverk</span>
          <h3 className="font-display text-2xl lg:text-3xl text-ink tracking-tight mt-1">
            FNs bærekraftsmål
          </h3>
        </div>
        <a
          href="https://sdgs.un.org/goals"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex text-[11px] font-mono uppercase tracking-wider text-ink-muted hover:text-clay-500 transition-colors"
        >
          sdgs.un.org ↗
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper-edge border border-paper-edge">
        {SDG_MAAL.map((maal) => (
          <article key={maal.nummer} className="bg-paper-soft p-6 lg:p-8">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-display text-5xl text-clay-500 tracking-tightest leading-none">
                {maal.nummer}
              </span>
              <span className="label-editorial">SDG</span>
            </div>
            <h4 className="font-display text-lg text-ink tracking-tight mb-3 leading-snug">
              {maal.tittel}
            </h4>
            <p className="text-sm text-ink-soft leading-relaxed">
              {maal.beskrivelse}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
