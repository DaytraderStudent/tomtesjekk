"use client";

import { useState, useRef } from "react";
import { Download, RefreshCw, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import type { Rapport } from "@/types";

interface BildegenereringProps {
  rapport: Rapport;
}

interface Bilde {
  id: string;
  label: string;
  bilde: string;
  beskrivelse: string | null;
}

export function Bildegenerering({ rapport }: BildegenereringProps) {
  const [bilder, setBilder] = useState<Bilde[]>([]);
  const [valgtId, setValgtId] = useState<string>("");
  const [referansebilde, setReferansebilde] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [visFullskjerm, setVisFullskjerm] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // % for before/after slider
  const sliderRef = useRef<HTMLDivElement>(null);

  const aktivtBilde = bilder.find((b) => b.id === valgtId) || bilder[0];

  const generer = async () => {
    setLaster(true);
    setFeil(null);

    // Extract relevant data from rapport
    const eiendomKort = rapport.kort.find((k) => k.id === "eiendom");
    const regKort = rapport.kort.find((k) => k.id === "regulering");
    const grunnKort = rapport.kort.find((k) => k.id === "grunn");
    const solKort = rapport.kort.find((k) => k.id === "solforhold");

    const tomteareal = eiendomKort?.raadata?.arealKvm ?? null;
    const regulering = regKort?.raadata
      ? {
          maksEtasjer: regKort.raadata.maksEtasjer,
          maksHoyde: regKort.raadata.maksHoyde,
          utnyttingsgrad: regKort.raadata.utnyttingsgrad,
        }
      : null;
    const grunnforhold = grunnKort ? grunnKort.beskrivelse : null;
    const solforhold = solKort?.raadata?.hovedretning ?? null;

    try {
      const res = await fetch("/api/bildegenerering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adresse: rapport.adresse.adressetekst,
          lat: rapport.adresse.representasjonspunkt.lat,
          lon: rapport.adresse.representasjonspunkt.lon,
          tomteareal,
          regulering,
          grunnforhold,
          solforhold,
          hoydeOverHavet: rapport.hoydeOverHavet,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setFeil(data.error);
      } else if (data.bilder && Array.isArray(data.bilder)) {
        setBilder(data.bilder);
        setValgtId(data.bilder[0]?.id || "");
        setReferansebilde(data.referansebildeBase64 || null);
      } else if (data.bilde) {
        // Backward-compat with old single-image response
        setBilder([{ id: "main", label: "Hovedvisning", bilde: data.bilde, beskrivelse: data.beskrivelse }]);
        setValgtId("main");
        setReferansebilde(data.referansebildeBase64 || null);
      }
    } catch {
      setFeil("Nettverksfeil — prøv igjen");
    } finally {
      setLaster(false);
    }
  };

  const lastNed = () => {
    if (!aktivtBilde) return;
    const a = document.createElement("a");
    a.href = aktivtBilde.bilde;
    a.download = `tomtesjekk-${aktivtBilde.id}-${rapport.adresse.adressetekst.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "-")}.png`;
    a.click();
  };

  const handleSliderMove = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <section className="bg-paper-soft border border-paper-edge fade-up">
      {/* Running head */}
      <div className="border-b border-paper-edge px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="label-editorial">Arkitektonisk visualisering</span>
          <h3 className="font-display text-xl text-ink tracking-tight mt-1">
            AI-konsept
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          Gemini 2.5 · 3 vinkler
        </span>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
        {bilder.length === 0 && !laster && (
          <div>
            <p className="text-sm text-ink-soft leading-relaxed max-w-xl mb-5">
              Gemini genererer tre vinkler av et hus som respekterer byggehøyde,
              utnyttelsesgrad og det faktiske terrenget — forankret i ortofoto
              av den eksakte tomten.
            </p>
            <Button onClick={generer} variant="outline" size="md">
              Generer husforslag
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {laster && (
          <div className="flex items-center gap-3 py-6">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
            <div>
              <p className="text-sm text-ink-muted">
                Genererer 3 vinkler parallelt...
              </p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mt-1">
                ~20–40 sekunder
              </p>
            </div>
          </div>
        )}

        {feil && (
          <div className="py-4">
            <p className="text-sm text-clay-700 mb-3">{feil}</p>
            <Button onClick={generer} variant="outline" size="sm">
              <RefreshCw className="w-3 h-3" />
              Prøv igjen
            </Button>
          </div>
        )}

        {bilder.length > 0 && !laster && aktivtBilde && (
          <div className="space-y-5">
            {/* Tabs for different angles — editorial pills */}
            {bilder.length > 1 && (
              <div className="flex gap-0 border border-paper-edge self-start">
                {bilder.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setValgtId(b.id)}
                    className={cn(
                      "text-[11px] font-mono uppercase tracking-wider px-4 py-2 border-r border-paper-edge last:border-r-0 transition-colors",
                      valgtId === b.id
                        ? "bg-ink text-paper"
                        : "bg-paper-soft text-ink-muted hover:bg-paper-deep hover:text-ink"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            {/* Before/after slider if reference photo available */}
            {referansebilde ? (
              <div className="space-y-1.5">
                <div
                  ref={sliderRef}
                  className="relative rounded-lg overflow-hidden shadow-md cursor-ew-resize select-none"
                  onPointerMove={handleSliderMove}
                  onPointerDown={handleSliderMove}
                >
                  {/* Reference (ortofoto) — underneath */}
                  <img
                    src={referansebilde}
                    alt="Ortofoto av tomten"
                    className="w-full h-auto block"
                  />
                  {/* AI-generated on top, clipped by slider position */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={aktivtBilde.bilde}
                      alt="AI-generert husforslag"
                      className="block max-w-none"
                      style={{
                        width: `${(100 / sliderPos) * 100}%`,
                        maxWidth: "none",
                      }}
                    />
                  </div>
                  {/* Slider handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-fjord-500">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-fjord-500 rounded-full" />
                        <div className="w-0.5 h-3 bg-fjord-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                    AI-konsept
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Ortofoto i dag
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center italic">
                  Dra i slideren for å sammenligne AI-konseptet med dagens ortofoto
                </p>
              </div>
            ) : (
              // No reference — just show the AI image
              <button
                onClick={() => setVisFullskjerm(true)}
                className="block w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-zoom-in"
              >
                <img
                  src={aktivtBilde.bilde}
                  alt="AI-generert husforslag"
                  className="w-full h-auto"
                />
              </button>
            )}

            {/* Description */}
            {aktivtBilde.beskrivelse && (
              <p className="text-xs text-ink-muted leading-relaxed italic max-w-2xl">
                {aktivtBilde.beskrivelse}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={generer} variant="outline" size="sm">
                <RefreshCw className="w-3 h-3" />
                Nye forslag
              </Button>
              <Button onClick={lastNed} variant="ghost" size="sm">
                <Download className="w-3 h-3" />
                Last ned
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {visFullskjerm && aktivtBilde && (
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
            src={aktivtBilde.bilde}
            alt="AI-generert husforslag"
            className="max-w-full max-h-full shadow-editorial-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
