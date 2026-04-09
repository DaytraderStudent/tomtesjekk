"use client";

import { cn } from "@/lib/utils";
import { PDFEksport } from "./PDFEksport";
import type { Rapport, TrafikklysStatus } from "@/types";

/* -------------------------------------------------------------------------
   DetaljerHero — editorial masthead for the full-page report
   Newspaper-inspired layout: large title, metadata strip, map plate
   ------------------------------------------------------------------------- */

function samletRisiko(kort: Rapport["kort"]): {
  status: TrafikklysStatus;
  label: string;
  dotColor: string;
  tone: string;
} {
  const harRod = kort.some((k) => k.status === "rod");
  const harGul = kort.some((k) => k.status === "gul");

  if (harRod)
    return {
      status: "rod",
      label: "Høy samlet risiko",
      dotColor: "#B8412C",
      tone: "border-clay-500/40 bg-clay-500/10 text-clay-700",
    };
  if (harGul)
    return {
      status: "gul",
      label: "Moderat samlet risiko",
      dotColor: "#C18A2F",
      tone: "border-[#C18A2F]/40 bg-[#C18A2F]/10 text-[#8B6220]",
    };
  return {
    status: "gronn",
    label: "Lav samlet risiko",
    dotColor: "#4A7C59",
    tone: "border-moss-500/40 bg-moss-500/10 text-moss-700",
  };
}

interface Props {
  rapport: Rapport;
}

export function DetaljerHero({ rapport }: Props) {
  const risiko = samletRisiko(rapport.kort);
  const dato = new Date(rapport.tidspunkt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const gronn = rapport.kort.filter((k) => k.status === "gronn").length;
  const gul = rapport.kort.filter((k) => k.status === "gul").length;
  const rod = rapport.kort.filter((k) => k.status === "rod").length;
  const gra = rapport.kort.filter((k) => k.status === "gra").length;

  return (
    <section className="detaljer-hero relative bg-paper border-b border-paper-edge">
      {/* Masthead strip */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-8 pb-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted">
          <span>Tomtesjekk</span>
          <span className="text-ink-faint">·</span>
          <span>Rapport {dato}</span>
        </div>
        <PDFEksport rapport={rapport} />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-12 lg:pb-20">
        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          {/* Left — editorial headline */}
          <div className="col-span-12 lg:col-span-8">
            <span className="label-editorial block mb-3">Analyse</span>
            <h1 className="font-display text-display-lg text-ink tracking-tightest leading-[0.95]">
              {rapport.adresse.adressetekst}
            </h1>

            {/* Meta strip */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {rapport.adresse.postnummer && (
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  {rapport.adresse.postnummer} {rapport.adresse.poststed}
                </span>
              )}
              {rapport.adresse.kommunenavn && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    {rapport.adresse.kommunenavn}
                  </span>
                </>
              )}
              {rapport.hoydeOverHavet !== null && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    {rapport.hoydeOverHavet} moh.
                  </span>
                </>
              )}
            </div>

            {/* Verdict line */}
            <div className="mt-8 flex items-center gap-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: risiko.dotColor }}
              />
              <span
                className={cn(
                  "text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 border",
                  risiko.tone
                )}
              >
                {risiko.label}
              </span>
            </div>

            {/* Score breakdown — numeric */}
            <div className="mt-10 grid grid-cols-4 gap-6 lg:gap-10 max-w-xl">
              <div>
                <div className="display-number text-4xl text-ink">{gronn}</div>
                <div className="label-editorial mt-1">Lav</div>
              </div>
              <div>
                <div className="display-number text-4xl text-ink">{gul}</div>
                <div className="label-editorial mt-1">Moderat</div>
              </div>
              <div>
                <div className="display-number text-4xl text-ink">{rod}</div>
                <div className="label-editorial mt-1">Høy</div>
              </div>
              <div>
                <div className="display-number text-4xl text-ink-muted">{gra}</div>
                <div className="label-editorial mt-1">Ukjent</div>
              </div>
            </div>
          </div>

          {/* Right — map plate */}
          <div className="col-span-12 lg:col-span-4 lg:pl-6 lg:border-l lg:border-paper-edge">
            <span className="label-editorial block mb-3">Kartbilde</span>
            {rapport.kartBilde ? (
              <div className="border border-paper-edge overflow-hidden">
                <img
                  src={rapport.kartBilde}
                  alt={`Kart over ${rapport.adresse.adressetekst}`}
                  className="w-full h-auto block"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-paper-deep border border-paper-edge" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
