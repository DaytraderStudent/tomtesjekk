"use client";

import { useState } from "react";
import { Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { KARTLAG } from "@/lib/kartlag";
import type { KartlagId } from "@/types";

interface Props {
  synlige: Record<KartlagId, boolean>;
  onToggle: (id: KartlagId) => void;
}

const KARTLAG_BESKRIVELSE: Record<KartlagId, string> = {
  stoy: "Veitrafikkstoy fra Statens vegvesen",
  matrikkel: "Eiendomsgrenser fra Kartverket",
  radon: "Radonaktsomhet fra NGU",
  losmasser: "Jordart og losmasser fra NGU",
  regulering: "Reguleringsplaner fra DiBK",
};

export function KartlagPanel({ synlige, onToggle }: Props) {
  const [apen, setApen] = useState(false);

  const antallAktive = Object.values(synlige).filter(Boolean).length;

  return (
    <>
      {/* Desktop panel */}
      <div className="hidden lg:block absolute top-20 left-4 z-[1000]">
        {apen ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-64 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-fjord-500" />
                <span className="text-sm font-semibold text-gray-900">Kartlag</span>
              </div>
              <button
                onClick={() => setApen(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {KARTLAG.map((lag) => (
                <button
                  key={lag.id}
                  onClick={() => onToggle(lag.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-8 h-5 rounded-full relative transition-colors shrink-0"
                    style={{
                      backgroundColor: synlige[lag.id] ? lag.farge : "#D1D5DB",
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                      style={{
                        transform: synlige[lag.id] ? "translateX(14px)" : "translateX(2px)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {lag.navn}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {KARTLAG_BESKRIVELSE[lag.id]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setApen(true)}
            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            <Layers className="w-5 h-5 text-fjord-500" />
            <span className="text-sm font-medium text-gray-700">Kartlag</span>
            {antallAktive > 0 && (
              <span className="bg-fjord-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {antallAktive}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Mobile floating button + panel */}
      <div className="lg:hidden absolute bottom-4 left-4 z-[1000]">
        {apen ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-60 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-fjord-500" />
                <span className="text-xs font-semibold text-gray-900">Kartlag</span>
              </div>
              <button
                onClick={() => setApen(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-2 space-y-0.5">
              {KARTLAG.map((lag) => (
                <button
                  key={lag.id}
                  onClick={() => onToggle(lag.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-7 h-4 rounded-full relative transition-colors shrink-0"
                    style={{
                      backgroundColor: synlige[lag.id] ? lag.farge : "#D1D5DB",
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform"
                      style={{
                        transform: synlige[lag.id] ? "translateX(12px)" : "translateX(2px)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {lag.navn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setApen(true)}
            className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 w-11 h-11 flex items-center justify-center hover:shadow-xl transition-shadow relative"
          >
            <Layers className="w-5 h-5 text-fjord-500" />
            {antallAktive > 0 && (
              <span className="absolute -top-1 -right-1 bg-fjord-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {antallAktive}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
