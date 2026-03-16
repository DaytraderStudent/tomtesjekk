"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusFarge } from "@/lib/trafikklys";
import type { AnalyseKort } from "@/types";

interface Props {
  kort: AnalyseKort;
  index?: number;
}

function gradientForStatus(status: string): string {
  switch (status) {
    case "gronn":
      return "from-emerald-50/60 to-white";
    case "gul":
      return "from-amber-50/60 to-white";
    case "rod":
      return "from-red-50/60 to-white";
    default:
      return "from-gray-50/60 to-white";
  }
}

function badgeBg(status: string): string {
  switch (status) {
    case "gronn":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/50";
    case "gul":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-300/50";
    case "rod":
      return "bg-red-100 text-red-800 ring-1 ring-red-300/50";
    default:
      return "bg-gray-100 text-gray-600 ring-1 ring-gray-300/50";
  }
}

export function Rapportkort({ kort, index = 0 }: Props) {
  const [erUtvidet, setErUtvidet] = useState(false);
  const innholdRef = useRef<HTMLDivElement>(null);
  const [innholdHoyde, setInnholdHoyde] = useState(0);
  const farge = statusFarge(kort.status);

  useEffect(() => {
    if (innholdRef.current) {
      setInnholdHoyde(innholdRef.current.scrollHeight);
    }
  }, [erUtvidet, kort.detaljer]);

  return (
    <div
      className={cn(
        "rapportkort-enter rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br",
        gradientForStatus(kort.status)
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: farge,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <button
        onClick={() => setErUtvidet(!erUtvidet)}
        className="w-full text-left p-4 flex items-start gap-3"
        aria-expanded={erUtvidet}
      >
        {/* Traffic light circle */}
        <div
          className="w-4 h-4 rounded-full shrink-0 mt-1 trafikklys-puls"
          style={{ backgroundColor: farge }}
          title={kort.statusTekst}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{kort.tittel}</h3>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300",
                erUtvidet && "rotate-180"
              )}
            />
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{kort.beskrivelse}</p>
          <span
            className={cn(
              "inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full",
              badgeBg(kort.status)
            )}
          >
            {kort.statusTekst}
          </span>
        </div>
      </button>

      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: erUtvidet ? `${innholdHoyde + 32}px` : "0px",
          opacity: erUtvidet ? 1 : 0,
        }}
      >
        <div ref={innholdRef} className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="pt-3 space-y-3">
            {kort.detaljer && (
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {kort.detaljer}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>Kilde:</span>
              <a
                href={kort.kildeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fjord-500 hover:underline flex items-center gap-0.5"
              >
                {kort.kilde}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
