"use client";

import { useState } from "react";
import { Eye, Sparkles, Trees, Home, Mountain, Navigation as NavIcon, Waves, Info, X, RefreshCw } from "lucide-react";
import type { Rapport as RapportType } from "@/types";

interface Props {
  rapport: RapportType;
}

interface Observasjon {
  kategori: string;
  funn: string;
  relevans: string;
}

interface FotoAnalyseData {
  sammendrag: string;
  observasjoner: Observasjon[];
  ortofotoBase64: string;
}

function ikonForKategori(kategori: string) {
  const k = kategori.toLowerCase();
  if (k.includes("veg")) return <Trees className="w-3.5 h-3.5" />;
  if (k.includes("bebyg")) return <Home className="w-3.5 h-3.5" />;
  if (k.includes("terr")) return <Mountain className="w-3.5 h-3.5" />;
  if (k.includes("adko") || k.includes("vei")) return <NavIcon className="w-3.5 h-3.5" />;
  if (k.includes("vann") || k.includes("vassdrag")) return <Waves className="w-3.5 h-3.5" />;
  return <Info className="w-3.5 h-3.5" />;
}

function fargeForKategori(kategori: string) {
  const k = kategori.toLowerCase();
  if (k.includes("veg")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (k.includes("bebyg")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (k.includes("terr")) return "bg-stone-100 text-stone-700 border-stone-200";
  if (k.includes("adko")) return "bg-slate-100 text-slate-700 border-slate-200";
  if (k.includes("vann")) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export function FotoAnalyse({ rapport }: Props) {
  const [data, setData] = useState<FotoAnalyseData | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [visFullskjerm, setVisFullskjerm] = useState(false);

  const analyser = async () => {
    setLaster(true);
    setFeil(null);
    try {
      const res = await fetch("/api/foto-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: rapport.adresse.representasjonspunkt.lat,
          lon: rapport.adresse.representasjonspunkt.lon,
          adresse: rapport.adresse.adressetekst,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setFeil(json.error);
      } else {
        setData(json);
      }
    } catch {
      setFeil("Nettverksfeil — prøv igjen");
    } finally {
      setLaster(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-violet-200 bg-gradient-to-r from-violet-100/60 to-fuchsia-100/40">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-bold text-violet-900">AI-analyse av ortofoto</h3>
        </div>
        <p className="text-[11px] text-violet-700 mt-0.5">
          Multimodal AI leser ekte luftfoto fra Kartverket og identifiserer fysiske forhold på tomten.
        </p>
      </div>

      <div className="p-4">
        {!data && !laster && (
          <button
            onClick={analyser}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-semibold hover:from-violet-600 hover:to-fuchsia-600 transition-all text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Analyser tomten fra luftfoto
          </button>
        )}

        {laster && (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-xs text-violet-600">Henter ortofoto og analyserer med Gemini...</p>
          </div>
        )}

        {feil && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{feil}</p>
            <button
              onClick={analyser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Prøv igjen
            </button>
          </div>
        )}

        {data && !laster && (
          <div className="space-y-3">
            {/* Thumbnail */}
            <button
              onClick={() => setVisFullskjerm(true)}
              className="block w-full rounded-lg overflow-hidden border border-violet-200 hover:border-violet-300 transition-colors cursor-zoom-in"
            >
              <img
                src={data.ortofotoBase64}
                alt="Ortofoto av tomten"
                className="w-full h-auto"
              />
            </button>

            {/* Sammendrag */}
            {data.sammendrag && (
              <div className="bg-white rounded-lg border border-violet-200 p-3">
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  &ldquo;{data.sammendrag}&rdquo;
                </p>
              </div>
            )}

            {/* Observasjoner */}
            {data.observasjoner && data.observasjoner.length > 0 && (
              <div className="space-y-2">
                {data.observasjoner.map((obs, i) => (
                  <div key={i} className="bg-white rounded-lg border border-violet-200 p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${fargeForKategori(
                          obs.kategori
                        )}`}
                      >
                        {ikonForKategori(obs.kategori)}
                        {obs.kategori}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{obs.funn}</p>
                        <p className="text-xs text-gray-500 mt-0.5 italic">
                          → {obs.relevans}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-violet-600">
                Kilde: Kartverket Norge i bilder · AI: Gemini 2.5 Flash
              </p>
              <button
                onClick={analyser}
                className="inline-flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-700"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Analyser på nytt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {visFullskjerm && data && (
        <div
          className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVisFullskjerm(false)}
        >
          <button
            onClick={() => setVisFullskjerm(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={data.ortofotoBase64}
            alt="Ortofoto"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
