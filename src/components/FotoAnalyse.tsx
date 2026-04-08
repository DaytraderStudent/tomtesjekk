"use client";

import { useState } from "react";
import { RefreshCw, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
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

function fargeForKategori(kategori: string) {
  const k = kategori.toLowerCase();
  if (k.includes("veg")) return "border-moss-500/40 bg-moss-500/10 text-moss-700";
  if (k.includes("bebyg")) return "border-[#C18A2F]/40 bg-[#C18A2F]/10 text-[#8B6220]";
  if (k.includes("terr")) return "border-stone-300 bg-stone-100 text-ink-soft";
  if (k.includes("adko")) return "border-stone-300 bg-stone-100 text-ink-soft";
  if (k.includes("vann")) return "border-clay-500/40 bg-clay-500/10 text-clay-700";
  return "border-paper-edge bg-paper text-ink-muted";
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
      if (json.error) setFeil(json.error);
      else setData(json);
    } catch {
      setFeil("Nettverksfeil — prøv igjen");
    } finally {
      setLaster(false);
    }
  };

  return (
    <section className="bg-paper-soft border border-paper-edge fade-up">
      <div className="border-b border-paper-edge px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="label-editorial">Multimodal AI</span>
          <h3 className="font-display text-xl text-ink tracking-tight mt-1">
            Lesning av ortofoto
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          Kartverket NiB · Gemini 2.5
        </span>
      </div>

      <div className="p-6 lg:p-8">
        {!data && !laster && (
          <div>
            <p className="text-sm text-ink-soft leading-relaxed max-w-xl mb-5">
              Send det faktiske luftfotoet av tomten til en multimodal AI som
              identifiserer vegetasjon, eksisterende bebyggelse, terreng, adkomst
              og vassdrag — faktabasert lesning forankret i det virkelige bildet.
            </p>
            <Button onClick={analyser} variant="outline" size="md">
              Analyser tomten fra luftfoto
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {laster && (
          <div className="flex items-center gap-3 py-6">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
            <p className="text-sm text-ink-muted">
              Henter ortofoto og analyserer med Gemini...
            </p>
          </div>
        )}

        {feil && (
          <div className="py-4">
            <p className="text-sm text-clay-700 mb-3">{feil}</p>
            <Button onClick={analyser} variant="outline" size="sm">
              <RefreshCw className="w-3 h-3" />
              Prøv igjen
            </Button>
          </div>
        )}

        {data && !laster && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-6">
            {/* Ortofoto thumbnail */}
            <div>
              <button
                onClick={() => setVisFullskjerm(true)}
                className="block w-full border border-paper-edge overflow-hidden cursor-zoom-in hover:opacity-95 transition-opacity"
              >
                <img
                  src={data.ortofotoBase64}
                  alt="Ortofoto av tomten"
                  className="w-full h-auto"
                />
              </button>
              <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Klikk for å forstørre
              </p>
            </div>

            {/* Analysis */}
            <div>
              {data.sammendrag && (
                <p className="font-display text-lg text-ink italic leading-relaxed mb-6 pl-4 border-l-2 border-clay-500">
                  &ldquo;{data.sammendrag}&rdquo;
                </p>
              )}

              {data.observasjoner && data.observasjoner.length > 0 && (
                <ul className="space-y-4">
                  {data.observasjoner.map((obs, i) => (
                    <li key={i} className="grid grid-cols-[auto,1fr] gap-3">
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border self-start whitespace-nowrap",
                          fargeForKategori(obs.kategori)
                        )}
                      >
                        {obs.kategori}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{obs.funn}</p>
                        <p className="text-xs text-ink-muted italic mt-0.5">
                          → {obs.relevans}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={analyser}
                className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-muted hover:text-clay-500 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Analyser på nytt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {visFullskjerm && data && (
        <div
          className="fixed inset-0 z-[2000] bg-ink/90 flex items-center justify-center p-4"
          onClick={() => setVisFullskjerm(false)}
        >
          <button
            onClick={() => setVisFullskjerm(false)}
            className="absolute top-4 right-4 p-2 text-paper/80 hover:text-paper transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={data.ortofotoBase64}
            alt="Ortofoto"
            className="max-w-full max-h-full shadow-editorial-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
