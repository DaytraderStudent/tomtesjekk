"use client";

import { StrukturertRapport } from "./StrukturertRapport";
import { PDFEksport } from "./PDFEksport";
import { Badge } from "./ui/badge";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import { statusFarge } from "@/lib/trafikklys";
import type { Rapport as RapportType, TrafikklysStatus } from "@/types";

/* -------------------------------------------------------------------------
   Rapport — compact sidebar version
   Shows summary + risk dots + AI report + compact analysis list.
   Heavy sections (klima, foto, bilde, SDG) live only on detaljer-siden.
   ------------------------------------------------------------------------- */

function kortLabel(id: string): string {
  const labels: Record<string, string> = {
    flom: "Flom", skred: "Skred", kvikkleire: "Kvikk", radon: "Radon",
    grunn: "Grunn", eiendom: "Eiendom", vei: "Vei", stoy: "Støy",
    boligpris: "Pris", kulturminner: "Kultur", regulering: "Plan",
    sol: "Sol", va: "VA", solforhold: "Sol", nvdb: "Vei", ssb: "Bygg",
  };
  return labels[id] || id.slice(0, 5);
}

function beregnSamletRisiko(kort: RapportType["kort"]): TrafikklysStatus {
  const statuser = kort.map((k) => k.status);
  if (statuser.includes("rod")) return "rod";
  if (statuser.includes("gul")) return "gul";
  return "gronn";
}

function samletRisikoVariant(status: TrafikklysStatus) {
  switch (status) {
    case "gronn": return { label: "Lav samlet risiko", variant: "green" as const };
    case "gul": return { label: "Moderat samlet risiko", variant: "amber" as const };
    case "rod": return { label: "Høy samlet risiko", variant: "red" as const };
    default: return { label: "Ukjent", variant: "default" as const };
  }
}

interface Props {
  rapport: RapportType;
}

export function Rapport({ rapport }: Props) {
  const samletRisiko = beregnSamletRisiko(rapport.kort);
  const risiko = samletRisikoVariant(samletRisiko);

  return (
    <div className="space-y-6 fade-up">
      {/* Masthead + address */}
      <header className="pb-4 border-b border-paper-edge">
        <span className="label-editorial block mb-2">Analyserapport</span>
        <h2 className="font-display text-2xl text-ink leading-tight tracking-tight">
          {rapport.adresse.adressetekst}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          {rapport.adresse.kommunenavn && <span>{rapport.adresse.kommunenavn}</span>}
          {rapport.hoydeOverHavet !== null && (
            <>
              <span className="text-ink-faint">·</span>
              <span>{rapport.hoydeOverHavet} moh.</span>
            </>
          )}
        </div>
      </header>

      {/* Risk summary — compact with vivid dots */}
      {rapport.kort.length > 0 && (
        <div className="bg-paper-soft border border-paper-edge p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label-editorial">Vurdering</span>
            <Badge variant={risiko.variant}>{risiko.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {rapport.kort.map((kort) => (
              <div
                key={kort.id}
                className="flex items-center gap-1.5"
                title={`${kort.tittel}: ${kort.statusTekst}`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: statusFarge(kort.status) }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                  {kortLabel(kort.id)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI structured report — compact mode */}
      {rapport.aiOppsummering?.strukturert ? (
        <StrukturertRapport
          data={rapport.aiOppsummering.strukturert}
          generert={rapport.aiOppsummering.generert}
        />
      ) : rapport.aiOppsummering ? (
        <div className="bg-paper-soft border border-paper-edge border-l-[3px] border-l-ink p-5">
          <span className="label-editorial block mb-2">AI-oppsummering</span>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
            {rapport.aiOppsummering.tekst}
          </p>
        </div>
      ) : null}

      {/* Compact analysis list — no expanding, just status per dimension */}
      <div>
        <span className="label-editorial block mb-3">Analysefunn</span>
        <div className="border border-paper-edge divide-y divide-paper-edge">
          {rapport.kort.map((kort) => (
            <div
              key={kort.id}
              className="flex items-center gap-3 px-4 py-3 bg-paper-soft"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: statusFarge(kort.status) }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-ink font-medium">{kort.tittel}</span>
              </div>
              <span className="text-[11px] text-ink-muted truncate max-w-[180px] text-right">
                {kort.statusTekst}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer — one liner */}
      <p className="text-[10px] text-ink-faint leading-relaxed">
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
