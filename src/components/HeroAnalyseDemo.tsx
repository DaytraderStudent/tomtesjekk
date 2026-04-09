"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated report preview for the landing page hero.
 * Simulates a live analysis running — results appear one by one
 * with staggered timing, dots animate to color, numbers count up.
 * Loops every ~8 seconds.
 */

interface Funn {
  label: string;
  verdi: string;
  detalj: string;
  farge: "green" | "amber" | "red";
  delayMs: number;
}

const FUNN: Funn[] = [
  { label: "Flom", verdi: "Lav", detalj: "Ikke i flomsone", farge: "green", delayMs: 600 },
  { label: "Radon", verdi: "Moderat", detalj: "TEK17 §13-5", farge: "amber", delayMs: 1200 },
  { label: "BYA", verdi: "25%", detalj: "180 m² tillatt", farge: "green", delayMs: 1800 },
  { label: "Grunn", verdi: "Leire", detalj: "Peling kan kreves", farge: "red", delayMs: 2400 },
];

const AI_TEKST =
  "Tomten ligger i et etablert boligområde med stabile grunnforhold i overflaten, men marin leire i dypet kan kreve peling — typisk mellom 100 000 og 500 000 kr avhengig av dybde. Innhent geoteknisk vurdering.";

const STEG = [
  "Henter eiendomsdata...",
  "Sjekker reguleringsplan...",
  "Analyserer naturfare...",
  "Henter grunnforhold...",
  "Genererer AI-rapport...",
];

const fargeMap = {
  green: "#22A355",
  amber: "#E5970F",
  red: "#DC3B2A",
};

const CYCLE_MS = 9000; // Total cycle time before reset

export function HeroAnalyseDemo() {
  const [tick, setTick] = useState(0); // ms elapsed in current cycle
  const [stegIdx, setStegIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Main tick — runs every 100ms
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick((prev) => {
        const next = prev + 100;
        if (next >= CYCLE_MS) return 0; // loop
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Step text rotator
  useEffect(() => {
    if (tick < 3000) {
      setStegIdx(Math.min(Math.floor(tick / 600), STEG.length - 1));
    }
  }, [tick]);

  const isScanning = tick < 3000;
  const showAi = tick >= 3200;
  const progress = isScanning ? Math.min((tick / 3000) * 100, 100) : 100;

  return (
    <div className="border border-paper-edge bg-paper-soft shadow-editorial-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-paper-edge">
        <span className="label-editorial">Live demo — screeningsrapport</span>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
          Buerjordet 17, Skien
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-paper-edge relative overflow-hidden">
        <div
          className="h-full bg-ink transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scanning status */}
      <div className="px-6 lg:px-8 py-3 border-b border-paper-edge flex items-center gap-3">
        {isScanning ? (
          <>
            <div className="w-2 h-2 rounded-full bg-data-amber animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              {STEG[stegIdx]}
            </span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-data-green" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Analyse ferdig — 14 dimensjoner sjekket
            </span>
          </>
        )}
      </div>

      {/* Results grid */}
      <div className="px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
          {FUNN.map((f) => {
            const isVisible = tick >= f.delayMs;
            return (
              <div
                key={f.label}
                className={cn(
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full transition-all duration-700"
                    style={{
                      backgroundColor: isVisible ? fargeMap[f.farge] : "#D3CCBF",
                      transform: isVisible ? "scale(1)" : "scale(0.5)",
                    }}
                  />
                  <span className="label-editorial">{f.label}</span>
                </div>
                <p className="font-display text-3xl text-ink tracking-tight">
                  {isVisible ? f.verdi : "—"}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {isVisible ? f.detalj : "\u00A0"}
                </p>
              </div>
            );
          })}
        </div>

        {/* AI summary — fades in after all results */}
        <div
          className={cn(
            "mt-6 pt-4 border-t border-paper-edge transition-all duration-700",
            showAi ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="label-editorial">AI-oppsummering</span>
            {showAi && tick < 5500 && (
              <span className="text-[10px] font-mono text-data-amber animate-pulse">
                skriver...
              </span>
            )}
          </div>
          <p className="text-sm text-ink-soft italic leading-relaxed max-w-2xl">
            {showAi && (
              <>
                &ldquo;
                {tick >= 5500
                  ? AI_TEKST
                  : AI_TEKST.slice(0, Math.floor(((tick - 3200) / 2300) * AI_TEKST.length))}
                {tick >= 5500 ? "" : "▌"}
                &rdquo;
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
