"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiStrukturertRapport } from "@/types";

interface Props {
  data: AiStrukturertRapport;
  generert?: string;
}

/* -------------------------------------------------------------------------
   StrukturertRapport — editorial AI report layout
   Typographic hierarchy, running heads, marginalia
   ------------------------------------------------------------------------- */

function usikkerhetLabel(usikkerhet: "lav" | "middels" | "hoy") {
  switch (usikkerhet) {
    case "lav":
      return { tekst: "Lav usikkerhet", className: "border-moss-500/40 bg-moss-500/10 text-moss-700" };
    case "middels":
      return { tekst: "Middels usikkerhet", className: "border-[#C18A2F]/40 bg-[#C18A2F]/10 text-[#8B6220]" };
    case "hoy":
      return { tekst: "Høy usikkerhet", className: "border-clay-500/40 bg-clay-500/10 text-clay-700" };
  }
}

export function StrukturertRapport({ data, generert }: Props) {
  return (
    <section className="bg-paper-soft border border-paper-edge fade-up">
      {/* Running head */}
      <div className="border-b border-paper-edge px-6 lg:px-8 py-4 flex items-center justify-between">
        <span className="label-editorial">AI Screeningsrapport</span>
        {generert && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Generert {new Date(generert).toLocaleString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div className="px-6 lg:px-8 py-8 lg:py-10 space-y-10">
        {/* Abstract / helhetsvurdering */}
        <div>
          <h3 className="label-editorial mb-4">Helhetsvurdering</h3>
          <p className="font-display text-xl lg:text-2xl text-ink leading-[1.45] tracking-tight max-w-3xl">
            {data.oppsummering}
          </p>
        </div>

        {/* Positive funn */}
        {data.positiveFunn && data.positiveFunn.length > 0 && (
          <div>
            <h3 className="label-editorial mb-4">Positive funn</h3>
            <ul className="space-y-2.5 max-w-3xl">
              {data.positiveFunn.map((f, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-ink-soft leading-relaxed">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-moss-500 mt-[3px] shrink-0">
                    +{String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Røde flagg */}
        {data.rodeFlagg && data.rodeFlagg.length > 0 && (
          <div>
            <h3 className="label-editorial mb-4">Ting å være oppmerksom på</h3>
            <div className="space-y-6 max-w-3xl">
              {data.rodeFlagg.map((f, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto,1fr] gap-4 pb-5 border-b border-paper-edge last:border-b-0 last:pb-0"
                >
                  <span className="font-display text-2xl text-clay-500 leading-none pt-[2px]">
                    §{String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-display text-lg text-ink tracking-tight">
                        {f.tema}
                      </h4>
                      {f.paragraf && (
                        <a
                          href={f.paragrafLenke || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-ink-muted hover:text-clay-500 border border-paper-edge px-2 py-0.5 transition-colors"
                        >
                          {f.paragraf}
                          {f.paragrafLenke && <ArrowUpRight className="w-2.5 h-2.5" />}
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">
                      {f.beskrivelse}
                    </p>
                    <p className="mt-2 text-sm text-ink-muted italic font-display">
                      → {f.anbefaling}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kostnadsfordyrende */}
        {data.kostnadsfordyrende && data.kostnadsfordyrende.length > 0 && (
          <div>
            <h3 className="label-editorial mb-4">Mulige kostnadsdrivere</h3>
            <div className="border border-paper-edge divide-y divide-paper-edge max-w-3xl">
              {data.kostnadsfordyrende.map((k, i) => {
                const badge = usikkerhetLabel(k.usikkerhet);
                return (
                  <div key={i} className="px-5 py-4 bg-paper-soft">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-base text-ink tracking-tight">
                          {k.tiltak}
                        </h4>
                        {k.begrunnelse && (
                          <p className="mt-1 text-sm text-ink-muted">{k.begrunnelse}</p>
                        )}
                      </div>
                      <span className="font-display text-xl text-clay-500 tracking-tight font-mono whitespace-nowrap">
                        {k.intervallKr}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "mt-2 inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border",
                        badge.className
                      )}
                    >
                      {badge.tekst}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Neste steg */}
        {data.nesteSteg && data.nesteSteg.length > 0 && (
          <div>
            <h3 className="label-editorial mb-4">Neste steg</h3>
            <ol className="space-y-3 max-w-3xl">
              {data.nesteSteg.map((s, i) => (
                <li key={i} className="flex gap-4 text-[15px] text-ink-soft leading-relaxed">
                  <span className="font-display text-2xl text-ink tracking-tight leading-none shrink-0 w-8">
                    {i + 1}.
                  </span>
                  <span className="pt-[6px]">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Disclaimer — editorial colophon */}
        {data.disclaimer && (
          <div className="pt-6 border-t border-paper-edge max-w-3xl">
            <p className="text-xs text-ink-muted italic leading-relaxed">
              {data.disclaimer}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
