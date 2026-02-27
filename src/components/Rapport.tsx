"use client";

import { Sparkles, AlertTriangle } from "lucide-react";
import { Rapportkort } from "./Rapportkort";
import { PDFEksport } from "./PDFEksport";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import type { Rapport as RapportType } from "@/types";

interface Props {
  rapport: RapportType;
}

export function Rapport({ rapport }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-fjord-500">
            Analyserapport
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {rapport.adresse.adressetekst}, {rapport.adresse.postnummer}{" "}
            {rapport.adresse.poststed}
          </p>
        </div>
        <PDFEksport rapport={rapport} />
      </div>

      {/* AI Summary */}
      {rapport.aiOppsummering && (
        <div className="bg-fjord-50 border-2 border-fjord-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-fjord-500" />
            <h3 className="font-semibold text-fjord-700">
              AI-oppsummering
            </h3>
          </div>
          <div className="text-sm text-fjord-800 leading-relaxed whitespace-pre-line prose prose-sm max-w-none">
            {rapport.aiOppsummering.tekst}
          </div>
          <p className="text-xs text-fjord-400 mt-3">
            Generert {new Date(rapport.aiOppsummering.generert).toLocaleString("nb-NO")}
          </p>
        </div>
      )}

      {/* Analysis cards */}
      <div className="space-y-3">
        {rapport.kort.map((kort) => (
          <Rapportkort key={kort.id} kort={kort} />
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
