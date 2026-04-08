"use client";

import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, ListChecks, ExternalLink } from "lucide-react";
import type { AiStrukturertRapport } from "@/types";

interface Props {
  data: AiStrukturertRapport;
  generert?: string;
}

function usikkerhetBadge(usikkerhet: "lav" | "middels" | "hoy") {
  switch (usikkerhet) {
    case "lav":
      return {
        tekst: "Lav usikkerhet",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "middels":
      return {
        tekst: "Middels usikkerhet",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "hoy":
      return {
        tekst: "Høy usikkerhet",
        className: "bg-red-100 text-red-700 border-red-200",
      };
  }
}

export function StrukturertRapport({ data, generert }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="ai-sammendrag-ramme rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-fjord-500 ai-sparkles-pulse" />
          <h3 className="font-bold text-fjord-700">AI-oppsummering</h3>
        </div>
        <p className="text-sm text-fjord-800 leading-relaxed">{data.oppsummering}</p>
        {generert && (
          <p className="text-xs text-fjord-400 mt-3">
            Generert {new Date(generert).toLocaleString("nb-NO")}
          </p>
        )}
      </div>

      {/* Positive funn */}
      {data.positiveFunn && data.positiveFunn.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">Positive funn</h4>
          </div>
          <ul className="space-y-1.5">
            {data.positiveFunn.map((f, i) => (
              <li key={i} className="text-sm text-emerald-900 flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Røde flagg */}
      {data.rodeFlagg && data.rodeFlagg.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-red-800">Ting å være oppmerksom på</h4>
          </div>
          <div className="space-y-3">
            {data.rodeFlagg.map((f, i) => (
              <div key={i} className="border-l-2 border-red-300 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-red-900">{f.tema}</span>
                  {f.paragraf && (
                    <a
                      href={f.paragrafLenke || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-xs font-medium text-fjord-600 bg-fjord-50 border border-fjord-200 rounded-full px-2 py-0.5 hover:bg-fjord-100 transition-colors"
                    >
                      {f.paragraf}
                      {f.paragrafLenke && <ExternalLink className="w-2.5 h-2.5" />}
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1">{f.beskrivelse}</p>
                <p className="text-xs text-gray-600 mt-1 italic">→ {f.anbefaling}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kostnadsfordyrende */}
      {data.kostnadsfordyrende && data.kostnadsfordyrende.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-700" />
            <h4 className="text-sm font-bold text-amber-900">Mulige kostnadsdrivere</h4>
          </div>
          <div className="space-y-2">
            {data.kostnadsfordyrende.map((k, i) => {
              const badge = usikkerhetBadge(k.usikkerhet);
              return (
                <div key={i} className="bg-white rounded-lg border border-amber-200 p-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{k.tiltak}</span>
                    <span className="text-sm font-bold text-amber-700">{k.intervallKr}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.className}`}>
                      {badge.tekst}
                    </span>
                    {k.begrunnelse && <span className="text-xs text-gray-500">— {k.begrunnelse}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Neste steg */}
      {data.nesteSteg && data.nesteSteg.length > 0 && (
        <div className="rounded-xl border border-fjord-200 bg-fjord-50/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-fjord-600" />
            <h4 className="text-sm font-bold text-fjord-800">Neste steg</h4>
          </div>
          <ol className="space-y-1.5">
            {data.nesteSteg.map((s, i) => (
              <li key={i} className="text-sm text-fjord-900 flex gap-2">
                <span className="font-bold text-fjord-500 shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Disclaimer */}
      {data.disclaimer && (
        <div className="text-xs text-gray-500 italic leading-relaxed border-t border-gray-200 pt-3">
          {data.disclaimer}
        </div>
      )}
    </div>
  );
}
