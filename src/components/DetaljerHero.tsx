"use client";

import { Sparkles, MapPin, Mountain, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rapport, TrafikklysStatus } from "@/types";

function samletRisiko(kort: Rapport["kort"]): {
  status: TrafikklysStatus;
  label: string;
  farge: string;
  bg: string;
} {
  const harRod = kort.some((k) => k.status === "rod");
  const harGul = kort.some((k) => k.status === "gul");

  if (harRod)
    return {
      status: "rod",
      label: "Høy risiko",
      farge: "text-red-100",
      bg: "bg-red-500/90",
    };
  if (harGul)
    return {
      status: "gul",
      label: "Moderat risiko",
      farge: "text-amber-100",
      bg: "bg-amber-500/90",
    };
  return {
    status: "gronn",
    label: "Lav risiko",
    farge: "text-emerald-100",
    bg: "bg-emerald-500/90",
  };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/[✓✗⚠△▲●]/g, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n");
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

  return (
    <section className="relative bg-gradient-to-br from-fjord-500 via-fjord-600 to-fjord-800 text-white overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left: info */}
          <div className="lg:col-span-3 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-fjord-200 text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>{dato}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                <MapPin className="w-6 h-6 inline-block mr-2 -mt-1" />
                {rapport.adresse.adressetekst}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-fjord-200">
                {rapport.adresse.kommunenavn && (
                  <span>{rapport.adresse.kommunenavn}</span>
                )}
                {rapport.adresse.postnummer && (
                  <span>
                    {rapport.adresse.postnummer} {rapport.adresse.poststed}
                  </span>
                )}
                {rapport.hoydeOverHavet !== null && (
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5" />
                    {rapport.hoydeOverHavet} moh.
                  </span>
                )}
              </div>
            </div>

            {/* Risk badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm",
                risiko.bg,
                risiko.farge
              )}
            >
              <span
                className={cn(
                  "w-3 h-3 rounded-full",
                  risiko.status === "rod" && "bg-red-200",
                  risiko.status === "gul" && "bg-amber-200",
                  risiko.status === "gronn" && "bg-emerald-200"
                )}
              />
              Samlet vurdering: {risiko.label}
            </div>

            {/* AI summary (truncated) */}
            {rapport.aiOppsummering && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2 text-fjord-100">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">AI-oppsummering</span>
                </div>
                <p className="text-sm text-fjord-100 leading-relaxed line-clamp-4">
                  {stripMarkdown(rapport.aiOppsummering.tekst)}
                </p>
              </div>
            )}
          </div>

          {/* Right: map image */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            {rapport.kartBilde ? (
              <div className="w-full rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <img
                  src={rapport.kartBilde}
                  alt={`Kart over ${rapport.adresse.adressetekst}`}
                  className="w-full h-auto"
                  style={{ imageRendering: "auto" }}
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-xl bg-white/10 border-2 border-white/10 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-white/30" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
