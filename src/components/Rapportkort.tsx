"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyseKort } from "@/types";

interface Props {
  kort: AnalyseKort;
  index?: number;
}

/* -------------------------------------------------------------------------
   Rapportkort — editorial data card
   Left-aligned numeric marker, subdued typography, minimal chrome
   ------------------------------------------------------------------------- */

function statusToneClasses(status: string) {
  switch (status) {
    case "gronn":
      return {
        indicator: "bg-data-green",
        accentBorder: "border-l-data-green",
        badgeBg: "bg-moss-500/8 border-moss-500/25 text-moss-700",
      };
    case "gul":
      return {
        indicator: "bg-data-amber",
        accentBorder: "border-l-data-amber",
        badgeBg: "bg-[#C18A2F]/10 border-[#C18A2F]/30 text-[#8B6220]",
      };
    case "rod":
      return {
        indicator: "bg-data-red",
        accentBorder: "border-l-data-red",
        badgeBg: "bg-clay-500/10 border-clay-500/30 text-clay-700",
      };
    default:
      return {
        indicator: "bg-data-gray",
        accentBorder: "border-l-stone-300",
        badgeBg: "bg-stone-100 border-stone-200 text-ink-muted",
      };
  }
}

function ByaVisualisering({ raadata }: { raadata: Record<string, any> }) {
  const utnyttingsgrad = raadata.utnyttingsgrad as number | null | undefined;
  const maksHoyde = raadata.maksHoyde as number | null | undefined;
  const maksEtasjer = raadata.maksEtasjer as number | null | undefined;
  const arealKvm = raadata.arealKvm as number | null | undefined;
  const maksBebyggetAreal = raadata.maksBebyggetAreal as number | null | undefined;
  const kilde = raadata.utnyttelseKilde as "plan" | "tek17" | undefined;

  if (!utnyttingsgrad && !maksHoyde && !maksEtasjer) return null;

  return (
    <div className="mt-5 border-t border-paper-edge pt-5">
      <div className="flex items-center justify-between mb-4">
        <span className="label-editorial">Byggerammer</span>
        {kilde && (
          <span
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border",
              kilde === "plan"
                ? "border-moss-500/40 bg-moss-500/10 text-moss-700"
                : "border-[#C18A2F]/40 bg-[#C18A2F]/10 text-[#8B6220]"
            )}
          >
            {kilde === "plan" ? "Fra plan" : "TEK17-referanse"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-px bg-paper-edge border border-paper-edge">
        {utnyttingsgrad != null && (
          <div className="bg-paper-soft px-4 py-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Maks BYA
            </div>
            <div className="font-display text-3xl text-ink tracking-tight">
              {utnyttingsgrad}
              <span className="text-lg text-ink-muted">%</span>
            </div>
          </div>
        )}
        {maksHoyde != null && (
          <div className="bg-paper-soft px-4 py-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Maks høyde
            </div>
            <div className="font-display text-3xl text-ink tracking-tight">
              {maksHoyde}
              <span className="text-lg text-ink-muted"> m</span>
            </div>
          </div>
        )}
        {maksEtasjer != null && (
          <div className="bg-paper-soft px-4 py-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Maks etasjer
            </div>
            <div className="font-display text-3xl text-ink tracking-tight">
              {maksEtasjer}
            </div>
          </div>
        )}
      </div>
      {arealKvm && maksBebyggetAreal && (
        <p className="mt-4 text-sm text-ink-soft leading-relaxed">
          Med tomteareal på <span className="font-mono text-ink">{Math.round(arealKvm)} m²</span>{" "}
          tillater reguleringsgrunnlaget inntil{" "}
          <span className="font-display text-lg text-clay-500">
            {Math.round(maksBebyggetAreal)} m²
          </span>{" "}
          bebygd areal.
          {kilde === "tek17" && (
            <span className="block mt-1 text-xs text-ink-muted italic">
              Tallet er TEK17-referanse, ikke bindende. Sjekk faktisk reguleringsplan før prosjektering.
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function Rapportkort({ kort, index = 0 }: Props) {
  const [erUtvidet, setErUtvidet] = useState(false);
  const innholdRef = useRef<HTMLDivElement>(null);
  const [innholdHoyde, setInnholdHoyde] = useState(0);
  const tone = statusToneClasses(kort.status);

  useEffect(() => {
    if (innholdRef.current) {
      setInnholdHoyde(innholdRef.current.scrollHeight);
    }
  }, [erUtvidet, kort.detaljer]);

  return (
    <article
      className={cn(
        "group bg-paper-soft border border-paper-edge border-l-[3px] transition-colors fade-up",
        tone.accentBorder
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={() => setErUtvidet(!erUtvidet)}
        className="w-full text-left p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        aria-expanded={erUtvidet}
      >
        <div className="flex items-start gap-5">
          {/* Numeric marker + status dot */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className={cn("w-2 h-2 rounded-full", tone.indicator)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl lg:text-2xl text-ink tracking-tight leading-tight">
                {kort.tittel}
              </h3>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-ink-muted shrink-0 mt-1 transition-transform duration-300",
                  erUtvidet && "rotate-180 text-ink"
                )}
              />
            </div>
            <p className="mt-1 text-sm text-ink-soft leading-relaxed">
              {kort.beskrivelse}
            </p>
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-mono uppercase tracking-wider",
                tone.badgeBg
              )}
            >
              {kort.statusTekst}
            </span>
          </div>
        </div>
      </button>

      <div
        className="transition-[max-height,opacity] duration-400 ease-out overflow-hidden"
        style={{
          maxHeight: erUtvidet ? `${innholdHoyde + 32}px` : "0px",
          opacity: erUtvidet ? 1 : 0,
        }}
      >
        <div ref={innholdRef} className="px-6 pb-6 pl-[4.75rem]">
          {kort.detaljer && (
            <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line pt-1">
              {kort.detaljer}
            </p>
          )}
          {kort.id === "regulering" && kort.raadata && (
            <ByaVisualisering raadata={kort.raadata} />
          )}
          <div className="mt-5 pt-4 border-t border-paper-edge flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              Kilde
            </span>
            <a
              href={kort.kildeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-ink hover:text-clay-500 transition-colors"
            >
              {kort.kilde}
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
