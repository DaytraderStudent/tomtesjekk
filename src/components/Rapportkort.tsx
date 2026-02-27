"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusFarge } from "@/lib/trafikklys";
import type { AnalyseKort } from "@/types";

interface Props {
  kort: AnalyseKort;
}

export function Rapportkort({ kort }: Props) {
  const [erUtvidet, setErUtvidet] = useState(false);
  const farge = statusFarge(kort.status);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeftWidth: "4px", borderLeftColor: farge }}
    >
      <button
        onClick={() => setErUtvidet(!erUtvidet)}
        className="w-full text-left p-4 flex items-start gap-3"
        aria-expanded={erUtvidet}
      >
        {/* Traffic light circle */}
        <div
          className="w-4 h-4 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: farge }}
          title={kort.statusTekst}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{kort.tittel}</h3>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-gray-400 shrink-0 transition-transform",
                erUtvidet && "rotate-180"
              )}
            />
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{kort.beskrivelse}</p>
          <span
            className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${farge}15`,
              color: farge,
            }}
          >
            {kort.statusTekst}
          </span>
        </div>
      </button>

      {erUtvidet && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
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
      )}
    </div>
  );
}
