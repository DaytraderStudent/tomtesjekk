"use client";

import { Sparkles, AlertTriangle, Shield } from "lucide-react";
import { Rapportkort } from "./Rapportkort";
import { PDFEksport } from "./PDFEksport";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import { statusFarge, statusLabel } from "@/lib/trafikklys";
import type { Rapport as RapportType, TrafikklysStatus } from "@/types";

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")     // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")  // bold
    .replace(/\*(.+?)\*/g, "$1")      // italic
    .replace(/[✓✗⚠△▲●]/g, "")        // special symbols
    .replace(/^\s*[-*]\s+/gm, "- ")   // normalize bullets
    .replace(/\n{3,}/g, "\n\n");      // collapse extra newlines
}

function kortLabel(id: string): string {
  const labels: Record<string, string> = {
    flom: "Flom",
    skred: "Skred",
    kvikkleire: "Kvikkl.",
    radon: "Radon",
    grunn: "Grunn",
    eiendom: "Eiendom",
    vei: "Vei",
    stoy: "Støy",
    boligpris: "Pris",
    kulturminner: "Kultur",
    regulering: "Reg.plan",
    sol: "Sol",
  };
  return labels[id] || id.slice(0, 5);
}

function beregnSamletRisiko(kort: RapportType["kort"]): TrafikklysStatus {
  const statuser = kort.map((k) => k.status);
  if (statuser.includes("rod")) return "rod";
  if (statuser.includes("gul")) return "gul";
  return "gronn";
}

function samletRisikoBg(status: TrafikklysStatus): string {
  switch (status) {
    case "gronn":
      return "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-400";
    case "gul":
      return "bg-amber-100 text-amber-900 ring-2 ring-amber-400";
    case "rod":
      return "bg-red-100 text-red-900 ring-2 ring-red-400";
    default:
      return "bg-gray-100 text-gray-700 ring-2 ring-gray-400";
  }
}

interface Props {
  rapport: RapportType;
}

export function Rapport({ rapport }: Props) {
  const samletRisiko = beregnSamletRisiko(rapport.kort);

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

      {/* Overall risk assessment header */}
      {rapport.kort.length > 0 && (
        <div className="samlet-risiko-enter flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-md">
          <Shield className="w-6 h-6 text-fjord-500 shrink-0" />
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-fjord-700">Samlet risikovurdering</h3>
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm ${samletRisikoBg(samletRisiko)}`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: statusFarge(samletRisiko),
                  boxShadow: `0 0 6px ${statusFarge(samletRisiko)}`,
                }}
              />
              {statusLabel(samletRisiko)}
            </span>
          </div>
        </div>
      )}

      {/* Risk overview bar */}
      {rapport.kort.length > 0 && (
        <div className="bg-fjord-50/60 rounded-xl border border-fjord-200/50 px-5 py-4 shadow-sm">
          <span className="text-xs font-bold text-fjord-600 uppercase tracking-wide mb-3 block">
            Risikosammendrag
          </span>
          <div className="flex items-start gap-3 flex-wrap">
            {rapport.kort.map((kort) => (
              <div
                key={kort.id}
                className="risiko-dot-enter group flex flex-col items-center gap-1.5"
                title={`${kort.tittel}: ${kort.statusTekst}`}
              >
                <div
                  className="w-4 h-4 rounded-full transition-transform duration-200 group-hover:scale-[1.6] cursor-default"
                  style={{
                    backgroundColor: statusFarge(kort.status),
                    boxShadow: `0 0 0 2px white, 0 0 6px ${statusFarge(kort.status)}`,
                  }}
                />
                <span className="text-[10px] font-medium text-fjord-500 leading-none">
                  {kortLabel(kort.id)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {rapport.aiOppsummering && (
        <div className="ai-sammendrag-ramme rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-fjord-500 ai-sparkles-pulse" />
            <h3 className="font-bold text-fjord-700">
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
