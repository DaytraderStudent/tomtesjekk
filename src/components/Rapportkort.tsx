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
      return "from-emerald-100/40 via-emerald-50/20 to-white";
    case "gul":
      return "from-amber-100/40 via-amber-50/20 to-white";
    case "rod":
      return "from-red-100/40 via-red-50/20 to-white";
    default:
      return "from-gray-100/40 via-gray-50/20 to-white";
  }
}

function badgeBg(status: string): string {
  switch (status) {
    case "gronn":
      return "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-400/60 shadow-sm shadow-emerald-200";
    case "gul":
      return "bg-amber-100 text-amber-900 ring-2 ring-amber-400/60 shadow-sm shadow-amber-200";
    case "rod":
      return "bg-red-100 text-red-900 ring-2 ring-red-400/60 shadow-sm shadow-red-200";
    default:
      return "bg-gray-100 text-gray-700 ring-2 ring-gray-400/60 shadow-sm shadow-gray-200";
  }
}

function glowShadow(status: string): string {
  switch (status) {
    case "gronn":
      return "0 0 0 3px rgba(46,204,113,0.25), 0 0 8px rgba(46,204,113,0.3)";
    case "gul":
      return "0 0 0 3px rgba(243,156,18,0.25), 0 0 8px rgba(243,156,18,0.3)";
    case "rod":
      return "0 0 0 3px rgba(231,76,60,0.25), 0 0 8px rgba(231,76,60,0.3)";
    default:
      return "0 0 0 3px rgba(156,163,175,0.25), 0 0 8px rgba(156,163,175,0.3)";
  }
}

function detailBorderColor(status: string): string {
  switch (status) {
    case "gronn": return "#2ECC71";
    case "gul": return "#F39C12";
    case "rod": return "#E74C3C";
    default: return "#9CA3AF";
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
        "rapportkort-enter rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-r",
        gradientForStatus(kort.status)
      )}
      style={{
        borderLeftWidth: "5px",
        borderLeftColor: farge,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <button
        onClick={() => setErUtvidet(!erUtvidet)}
        className="w-full text-left p-4 flex items-start gap-3"
        aria-expanded={erUtvidet}
      >
        {/* Traffic light circle — larger with glow ring */}
        <div
          className="w-5 h-5 rounded-full shrink-0 mt-0.5 trafikklys-puls"
          style={{
            backgroundColor: farge,
            boxShadow: glowShadow(kort.status),
          }}
          title={kort.statusTekst}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-base">{kort.tittel}</h3>
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
              "inline-block mt-2 text-xs font-bold px-3.5 py-1.5 rounded-full",
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
        <div
          ref={innholdRef}
          className="px-4 pb-4 pt-0 border-t border-gray-100"
          style={{
            borderLeft: `4px solid ${detailBorderColor(kort.status)}`,
            marginLeft: "12px",
          }}
        >
          <div className="pt-3 pl-3 space-y-3">
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
