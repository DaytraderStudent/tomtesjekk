"use client";

import { Sparkles, AlertTriangle } from "lucide-react";
import { Rapportkort } from "./Rapportkort";
import { PDFEksport } from "./PDFEksport";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import { statusFarge } from "@/lib/trafikklys";
import type { Rapport as RapportType } from "@/types";

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")     // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")  // bold
    .replace(/\*(.+?)\*/g, "$1")      // italic
    .replace(/[✓✗⚠△▲●]/g, "")        // special symbols
    .replace(/^\s*[-*]\s+/gm, "- ")   // normalize bullets
    .replace(/\n{3,}/g, "\n\n");      // collapse extra newlines
}

interface Props {
  rapport: RapportType;
}

export function Rapport({ rapport }: Props) {
  return (
    <div className="space-y-4 rapport-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-fjord-500">
            Analyserapport
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {rapport.adresse.adressetekst}, {rapport.adresse.postnummer}{" "}
            {rapport.adresse.poststed}
            {rapport.hoydeOverHavet !== null && (
              <span className="ml-1 text-fjord-400">
                ({rapport.hoydeOverHavet} moh.)
              </span>
            )}
          </p>
        </div>
        <PDFEksport rapport={rapport} />
      </div>

      {/* Risk overview bar */}
      {rapport.kort.length > 0 && (
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
          <span className="text-xs font-medium text-gray-500 mr-1 shrink-0">Risikosammendrag</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {rapport.kort.map((kort) => (
              <div
                key={kort.id}
                className="risiko-dot-enter group relative"
                title={`${kort.tittel}: ${kort.statusTekst}`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full transition-transform duration-200 group-hover:scale-150 cursor-default"
                  style={{ backgroundColor: statusFarge(kort.status) }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {rapport.aiOppsummering && (
        <div className="ai-sammendrag-ramme rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-fjord-500" />
            <h3 className="font-semibold text-fjord-700">
              AI-oppsummering
            </h3>
          </div>
          <div className="text-sm text-fjord-800 leading-relaxed whitespace-pre-line max-w-none">
            {stripMarkdown(rapport.aiOppsummering.tekst)}
          </div>
          <p className="text-xs text-fjord-400 mt-3">
            Generert {new Date(rapport.aiOppsummering.generert).toLocaleString("nb-NO")}
          </p>
        </div>
      )}

      {/* Analysis cards */}
      <div className="space-y-3">
        {rapport.kort.map((kort, i) => (
          <Rapportkort key={kort.id} kort={kort} index={i} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
