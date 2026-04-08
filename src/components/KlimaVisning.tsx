"use client";

import { useState, useEffect } from "react";
import { Cloud, Waves, CloudRain, Droplets, TrendingUp, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KlimaProjeksjonResultat, KartverketAdresse } from "@/types";

interface Props {
  adresse: KartverketAdresse;
}

function havstigningBadge(niva: "ingen" | "lav" | "moderat" | "hoy") {
  switch (niva) {
    case "hoy":
      return { className: "bg-red-100 text-red-800 border-red-300", tekst: "Høy risiko" };
    case "moderat":
      return { className: "bg-amber-100 text-amber-800 border-amber-300", tekst: "Moderat risiko" };
    case "lav":
      return { className: "bg-blue-100 text-blue-800 border-blue-300", tekst: "Lav risiko" };
    default:
      return { className: "bg-emerald-100 text-emerald-800 border-emerald-300", tekst: "Ingen direkte risiko" };
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
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-sm text-blue-700">Henter klimaprojeksjoner...</span>
        </div>
      </div>
    );
  }

  if (feil || !data) return null;

  const havBadge = data.havstigning ? havstigningBadge(data.havstigning.risikoNiva) : null;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-200 bg-gradient-to-r from-blue-100/70 to-sky-100/50">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-900">Klima 2100 — hva betyr klimaendringene for denne tomten?</h3>
        </div>
        <p className="text-[11px] text-blue-700 mt-0.5">
          Projeksjon {data.tidshorisont} · Scenario: {data.scenario} · Fylke: {data.fylke}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Havstigning */}
        {data.havstigning && (
          <div className="bg-white rounded-lg border border-blue-200 p-3">
            <div className="flex items-start gap-2">
              <Waves className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">Havnivåstigning</span>
                  {havBadge && (
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        havBadge.className
                      )}
                    >
                      {havBadge.tekst}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-700">+{data.havstigning.verdiCm} cm</span>
                  <span className="text-xs text-gray-500">relativ til 1995-2014</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  {data.havstigning.kommentar}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nedbør */}
        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <div className="flex items-start gap-2">
            <CloudRain className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-gray-700">Nedbør</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <div className="text-lg font-bold text-blue-700">
                    +{data.nedbor.arligEndringProsent}%
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight">årlig</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-700">
                    +{data.nedbor.ekstremEndringProsent}%
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight">
                    ekstremnedbør
                    <br />
                    (kraftigste døgn)
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                {data.nedbor.kommentar}
              </p>
            </div>
          </div>
        </div>

        {/* Flom */}
        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <div className="flex items-start gap-2">
            <Droplets className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-gray-700">200-års flomnivå</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-700">
                  +{data.flom.okningProsent}%
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  klimapåslag 2100
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                {data.flom.kommentar}
              </p>
            </div>
          </div>
        </div>

        {/* SDG tag + sources */}
        <div className="flex items-start gap-2 text-[10px] text-blue-600 pt-1">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">FNs bærekraftsmål:</span> Denne seksjonen adresserer
            SDG 11.5 (redusere tap fra katastrofer) og SDG 13.1 (klimatilpasning).
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.ansvarligInstansLenker.map((lenke) => (
            <a
              key={lenke.url}
              href={lenke.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-700 hover:underline"
            >
              {lenke.navn}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
