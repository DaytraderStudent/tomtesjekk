"use client";

import { Rapportkort } from "./Rapportkort";
import { Bildegenerering } from "./Bildegenerering";
import { StrukturertRapport } from "./StrukturertRapport";
import { KlimaVisning } from "./KlimaVisning";
import { FotoAnalyse } from "./FotoAnalyse";
import { SdgSeksjon } from "./SdgSeksjon";
import { PDFEksport } from "./PDFEksport";
import { Badge } from "./ui/badge";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import { statusFarge } from "@/lib/trafikklys";
import type { Rapport as RapportType, TrafikklysStatus } from "@/types";

function kortLabel(id: string): string {
  const labels: Record<string, string> = {
    flom: "Flom",
    skred: "Skred",
    kvikkleire: "Kvikk",
    radon: "Radon",
    grunn: "Grunn",
    eiendom: "Eiendom",
    vei: "Vei",
    stoy: "Støy",
    boligpris: "Pris",
    kulturminner: "Kultur",
    regulering: "Plan",
    sol: "Sol",
    va: "VA",
    solforhold: "Sol",
    nvdb: "Vei",
  };
  return labels[id] || id.slice(0, 5);
}

function beregnSamletRisiko(kort: RapportType["kort"]): TrafikklysStatus {
  const statuser = kort.map((k) => k.status);
  if (statuser.includes("rod")) return "rod";
  if (statuser.includes("gul")) return "gul";
  return "gronn";
}

function samletRisikoVariant(status: TrafikklysStatus): {
  label: string;
  variant: "green" | "amber" | "red" | "default";
} {
  switch (status) {
    case "gronn":
      return { label: "Lav samlet risiko", variant: "green" };
    case "gul":
      return { label: "Moderat samlet risiko", variant: "amber" };
    case "rod":
      return { label: "Høy samlet risiko", variant: "red" };
    default:
      return { label: "Ukjent", variant: "default" };
  }
}

interface Props {
  rapport: RapportType;
}

export function Rapport({ rapport }: Props) {
  const samletRisiko = beregnSamletRisiko(rapport.kort);
  const risiko = samletRisikoVariant(samletRisiko);

  return (
    <div className="space-y-8 fade-up">
      {/* Editorial masthead */}
      <header className="pb-6 border-b border-paper-edge">
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className="label-editorial">Analyserapport</span>
          <PDFEksport rapport={rapport} />
        </div>
        <h2 className="font-display text-display-sm text-ink leading-tight">
          {rapport.adresse.adressetekst}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          {(rapport.adresse.postnummer || rapport.adresse.poststed) && (
            <span>
              {rapport.adresse.postnummer} {rapport.adresse.poststed}
            </span>
          )}
          {rapport.adresse.kommunenavn && <span>{rapport.adresse.kommunenavn}</span>}
          {rapport.hoydeOverHavet !== null && (
            <span>{rapport.hoydeOverHavet} moh.</span>
          )}
        </div>
      </header>

      {/* Overall verdict + risk dots — editorial summary bar */}
      {rapport.kort.length > 0 && (
        <div className="bg-paper-soft border border-paper-edge p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="label-editorial">Samlet vurdering</span>
            <Badge variant={risiko.variant}>{risiko.label}</Badge>
          </div>

          {/* Dot grid */}
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {rapport.kort.map((kort) => (
              <div
                key={kort.id}
                className="group flex items-center gap-2"
                title={`${kort.tittel}: ${kort.statusTekst}`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusFarge(kort.status) }}
                />
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  {kortLabel(kort.id)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI structured report */}
      {rapport.aiOppsummering?.strukturert ? (
        <StrukturertRapport
          data={rapport.aiOppsummering.strukturert}
          generert={rapport.aiOppsummering.generert}
        />
      ) : rapport.aiOppsummering ? (
        <div className="bg-paper-soft border border-paper-edge border-l-[3px] border-l-ink p-6">
          <span className="label-editorial block mb-3">AI-oppsummering</span>
          <p className="font-display text-lg text-ink leading-relaxed whitespace-pre-line">
            {rapport.aiOppsummering.tekst}
          </p>
        </div>
      ) : null}

      {/* Climate projection */}
      <KlimaVisning adresse={rapport.adresse} />

      {/* AI photo analysis */}
      <FotoAnalyse rapport={rapport} />

      {/* AI house concept */}
      <Bildegenerering rapport={rapport} />

      {/* Analysis cards grid */}
      <div className="space-y-3">
        <span className="label-editorial block mb-2">Detaljerte funn</span>
        {rapport.kort.map((kort, i) => (
          <Rapportkort key={kort.id} kort={kort} index={i} />
        ))}
      </div>

      {/* UN SDG */}
      <SdgSeksjon />

      {/* Disclaimer */}
      <div className="border-t border-paper-edge pt-6 mt-6">
        <span className="label-editorial block mb-2">Ansvarsfraskrivelse</span>
        <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
