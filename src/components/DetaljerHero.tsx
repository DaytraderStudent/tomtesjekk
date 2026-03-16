"use client";

import { useState } from "react";
import { Sparkles, MapPin, Mountain, Clock, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rapport, TrafikklysStatus } from "@/types";

function samletRisiko(kort: Rapport["kort"]): {
  status: TrafikklysStatus;
  label: string;
  farge: string;
  bg: string;
  glowColor: string;
} {
  const harRod = kort.some((k) => k.status === "rod");
  const harGul = kort.some((k) => k.status === "gul");

  if (harRod)
    return {
      status: "rod",
      label: "Høy risiko",
      farge: "text-red-100",
      bg: "bg-red-500/90",
      glowColor: "rgba(239, 68, 68, 0.6)",
    };
  if (harGul)
    return {
      status: "gul",
      label: "Moderat risiko",
      farge: "text-amber-100",
      bg: "bg-amber-500/90",
      glowColor: "rgba(245, 158, 11, 0.6)",
    };
  return {
    status: "gronn",
    label: "Lav risiko",
    farge: "text-emerald-100",
    bg: "bg-emerald-500/90",
    glowColor: "rgba(16, 185, 129, 0.6)",
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

/** SVG topographic contour pattern for the hero background */
function TopoPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none hero-topo-drift"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="topo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <path d="M20 80 Q60 20 100 60 T180 50" fill="none" stroke="white" strokeWidth="1.2" />
          <path d="M10 120 Q50 70 100 100 T190 90" fill="none" stroke="white" strokeWidth="0.8" />
          <path d="M0 160 Q40 110 90 140 T200 130" fill="none" stroke="white" strokeWidth="1" />
          <path d="M30 30 Q80 0 130 25 T200 20" fill="none" stroke="white" strokeWidth="0.6" />
          <path d="M15 190 Q60 160 110 180 T200 170" fill="none" stroke="white" strokeWidth="0.7" />
          <circle cx="60" cy="55" r="18" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="60" cy="55" r="30" fill="none" stroke="white" strokeWidth="0.4" />
          <circle cx="150" cy="140" r="14" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="150" cy="140" r="24" fill="none" stroke="white" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topo)" />
    </svg>
  );
}

/** Score summary dots — shows green/yellow/red item counts */
function ScoreDots({ kort }: { kort: Rapport["kort"] }) {
  const gronn = kort.filter((k) => k.status === "gronn").length;
  const gul = kort.filter((k) => k.status === "gul").length;
  const rod = kort.filter((k) => k.status === "rod").length;
  const gra = kort.filter((k) => k.status === "gra").length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {gronn > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: gronn }).map((_, i) => (
              <span
                key={`g-${i}`}
                className="w-3.5 h-3.5 rounded-full risiko-dot-enter"
                style={{
                  backgroundColor: "#2ECC71",
                  boxShadow: "0 0 6px rgba(46, 204, 113, 0.5)",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-emerald-200 font-medium">{gronn} lav</span>
        </div>
      )}
      {gul > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: gul }).map((_, i) => (
              <span
                key={`y-${i}`}
                className="w-3.5 h-3.5 rounded-full risiko-dot-enter"
                style={{
                  backgroundColor: "#F39C12",
                  boxShadow: "0 0 6px rgba(243, 156, 18, 0.5)",
                  animationDelay: `${(gronn + i) * 0.05}s`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-amber-200 font-medium">{gul} moderat</span>
        </div>
      )}
      {rod > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: rod }).map((_, i) => (
              <span
                key={`r-${i}`}
                className="w-3.5 h-3.5 rounded-full risiko-dot-enter"
                style={{
                  backgroundColor: "#E74C3C",
                  boxShadow: "0 0 6px rgba(231, 76, 60, 0.5)",
                  animationDelay: `${(gronn + gul + i) * 0.05}s`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-red-200 font-medium">{rod} høy</span>
        </div>
      )}
      {gra > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: gra }).map((_, i) => (
              <span
                key={`x-${i}`}
                className="w-3.5 h-3.5 rounded-full risiko-dot-enter"
                style={{
                  backgroundColor: "#9CA3AF",
                  animationDelay: `${(gronn + gul + rod + i) * 0.05}s`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-300 font-medium">{gra} ukjent</span>
        </div>
      )}
    </div>
  );
}

interface Props {
  rapport: Rapport;
}

export function DetaljerHero({ rapport }: Props) {
  const [aiUtvidet, setAiUtvidet] = useState(false);
  const risiko = samletRisiko(rapport.kort);
  const dato = new Date(rapport.tidspunkt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="detaljer-hero relative text-white overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="hero-gradient-mesh absolute inset-0" />

      {/* Topographic contour pattern — clearly visible */}
      <TopoPattern />

      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/8 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/8 rounded-full" />
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

            {/* Risk badge — LARGE and prominent with glow */}
            <div
              className={cn(
                "hero-risk-badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-base",
                risiko.farge
              )}
              style={{
                boxShadow: `0 0 20px ${risiko.glowColor}, 0 0 40px ${risiko.glowColor}`,
              }}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full hero-risk-dot-pulse",
                  risiko.status === "rod" && "bg-red-200",
                  risiko.status === "gul" && "bg-amber-200",
                  risiko.status === "gronn" && "bg-emerald-200"
                )}
              />
              Samlet vurdering: {risiko.label}
            </div>

            {/* Score dots — colored circles showing green/yellow/red counts */}
            <ScoreDots kort={rapport.kort} />

            {/* PDF download button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-sm font-semibold text-white transition-colors print:hidden"
            >
              <Download className="w-4 h-4" />
              Last ned PDF
            </button>

            {/* AI summary (expandable) with visible rotating gradient border */}
            {rapport.aiOppsummering && (
              <div className="hero-ai-card-v2 rounded-xl p-[2px]">
                <div className="bg-fjord-700/90 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-fjord-100">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span className="text-sm font-bold">AI-oppsummering</span>
                  </div>
                  <p
                    className={cn(
                      "text-sm text-fjord-100 leading-relaxed whitespace-pre-line",
                      !aiUtvidet && "line-clamp-4"
                    )}
                  >
                    {stripMarkdown(rapport.aiOppsummering.tekst)}
                  </p>
                  <button
                    onClick={() => setAiUtvidet(!aiUtvidet)}
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors"
                  >
                    {aiUtvidet ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Se mindre
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Se hele oppsummeringen
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: map image with glowing border */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            {rapport.kartBilde ? (
              <div
                className="hero-map-glow w-full rounded-xl overflow-hidden border-2 shadow-2xl group"
                style={{
                  borderColor: risiko.glowColor,
                  boxShadow: `0 0 24px ${risiko.glowColor}, 0 4px 20px rgba(0,0,0,0.3)`,
                }}
              >
                <img
                  src={rapport.kartBilde}
                  alt={`Kart over ${rapport.adresse.adressetekst}`}
                  className="w-full h-auto transition-transform duration-500 ease-out group-hover:scale-105"
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
