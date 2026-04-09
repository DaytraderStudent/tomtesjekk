"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KlimaProjeksjonResultat, KartverketAdresse } from "@/types";

interface Props {
  adresse: KartverketAdresse;
}

function havstigningTone(niva: "ingen" | "lav" | "moderat" | "hoy") {
  switch (niva) {
    case "hoy":
      return { badge: "border-clay-500/40 bg-clay-500/10 text-clay-700", tekst: "Høy risiko" };
    case "moderat":
      return { badge: "border-[#C18A2F]/40 bg-[#C18A2F]/10 text-[#8B6220]", tekst: "Moderat risiko" };
    case "lav":
      return { badge: "border-stone-300 bg-stone-100 text-ink-muted", tekst: "Lav risiko" };
    default:
      return { badge: "border-moss-500/40 bg-moss-500/10 text-moss-700", tekst: "Ingen direkte risiko" };
  }
}

export function KlimaVisning({ adresse }: Props) {
  const [data, setData] = useState<KlimaProjeksjonResultat | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState(false);

  useEffect(() => {
    let kansellert = false;
    (async () => {
      try {
        const { lat, lon } = adresse.representasjonspunkt;
        const res = await fetch(
          `/api/klima-projeksjon?lat=${lat}&lon=${lon}&kommunenummer=${adresse.kommunenummer || ""}`
        );
        if (!res.ok) throw new Error("Request failed");
        const json = await res.json();
        if (!kansellert) setData(json);
      } catch {
        if (!kansellert) setFeil(true);
      } finally {
        if (!kansellert) setLaster(false);
      }
    })();
    return () => {
      kansellert = true;
    };
  }, [adresse]);

  if (laster) {
    return (
      <div className="bg-paper-soft border border-paper-edge px-6 py-5">
        <span className="label-editorial">Henter klimaprojeksjoner...</span>
      </div>
    );
  }

  if (feil || !data) return null;

  const havTone = data.havstigning ? havstigningTone(data.havstigning.risikoNiva) : null;

  return (
    <section className="bg-paper-soft border border-paper-edge fade-up">
      {/* Running head */}
      <div className="border-b border-paper-edge px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="label-editorial">Klimaprojeksjon 2100</span>
          <h3 className="font-display text-xl text-ink tracking-tight mt-1">
            Hva klimaendringene betyr for tomten
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          {data.scenario} · {data.fylke}
        </span>
      </div>

      <div className="px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-paper-edge border border-paper-edge">
        {/* Havstigning */}
        {data.havstigning && (
          <div className="bg-paper-soft p-6">
            <div className="flex items-start justify-between gap-2 mb-4">
              <span className="label-editorial">Havnivåstigning</span>
              {havTone && (
                <span
                  className={cn(
                    "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border whitespace-nowrap",
                    havTone.badge
                  )}
                >
                  {havTone.tekst}
                </span>
              )}
            </div>
            <div className="display-number text-5xl text-ink mb-1">
              +{data.havstigning.verdiCm}
              <span className="text-lg text-ink-muted font-sans font-normal"> cm</span>
            </div>
            <p className="text-xs text-ink-muted italic mb-3">
              relativ til 1995–2014
            </p>
            <p className="text-xs text-ink-soft leading-relaxed">
              {data.havstigning.kommentar}
            </p>
          </div>
        )}

        {/* Nedbør */}
        <div className="bg-paper-soft p-6">
          <span className="label-editorial block mb-4">Nedbør</span>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="display-number text-4xl text-ink">
                +{data.nedbor.arligEndringProsent}
                <span className="text-base text-ink-muted font-sans font-normal">%</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mt-1">
                årlig
              </div>
            </div>
            <div>
              <div className="display-number text-4xl text-clay-500">
                +{data.nedbor.ekstremEndringProsent}
                <span className="text-base text-ink-muted font-sans font-normal">%</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mt-1">
                ekstremnedbør
              </div>
            </div>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            {data.nedbor.kommentar}
          </p>
        </div>

        {/* Flom */}
        <div className="bg-paper-soft p-6">
          <span className="label-editorial block mb-4">200-års flomnivå</span>
          <div className="display-number text-5xl text-ink mb-1">
            +{data.flom.okningProsent}
            <span className="text-lg text-ink-muted font-sans font-normal">%</span>
          </div>
          <p className="text-xs text-ink-muted italic mb-3">klimapåslag mot 2100</p>
          <p className="text-xs text-ink-soft leading-relaxed">
            {data.flom.kommentar}
          </p>
        </div>
      </div>

      {/* Sources footer */}
      <div className="px-6 lg:px-8 py-4 border-t border-paper-edge flex items-center justify-between flex-wrap gap-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Adresserer UN SDG 11.5 og 13.1
        </span>
        <div className="flex flex-wrap gap-3">
          {data.ansvarligInstansLenker.map((lenke) => (
            <a
              key={lenke.url}
              href={lenke.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted hover:text-clay-500 transition-colors"
            >
              {lenke.navn}
              <ArrowUpRight className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
