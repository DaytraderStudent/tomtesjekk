"use client";

import { useState, useRef } from "react";
import { Sparkles, Download, RefreshCw, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-fjord-50 to-amber-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-display font-semibold text-sm text-fjord-700">
            AI Husforslag
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Tre AI-genererte vinkler av hvordan et hus kan se ut på denne tomten
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {bilder.length === 0 && !laster && (
          <button
            onClick={generer}
            disabled={laster}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-fjord-500 to-fjord-600 text-white rounded-lg font-semibold hover:from-fjord-600 hover:to-fjord-700 transition-all text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generer husforslag (3 vinkler)
          </button>
        )}

        {laster && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-3 border-fjord-200 border-t-fjord-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Genererer 3 vinkler parallelt med AI...</p>
            <p className="text-xs text-gray-400">Dette kan ta 20-40 sekunder</p>
          </div>
        )}

        {feil && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-3">{feil}</p>
            <button
              onClick={generer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-fjord-600 border border-fjord-200 rounded-lg hover:bg-fjord-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Prøv igjen
            </button>
          </div>
        )}

        {bilder.length > 0 && !laster && aktivtBilde && (
          <div className="space-y-3">
            {/* Tabs for different angles */}
            {bilder.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {bilder.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setValgtId(b.id)}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                      valgtId === b.id
                        ? "bg-fjord-500 text-white border-fjord-500"
                        : "bg-white text-fjord-600 border-fjord-200 hover:bg-fjord-50"
                    )}
                  >
                    <Camera className="w-3 h-3" />
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
              <p className="text-xs text-gray-500 leading-relaxed italic">
                {aktivtBilde.beskrivelse}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={generer}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-fjord-600 border border-fjord-200 rounded-lg hover:bg-fjord-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nye forslag
              </button>
              <button
                onClick={lastNed}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-fjord-600 border border-fjord-200 rounded-lg hover:bg-fjord-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Last ned
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {visFullskjerm && aktivtBilde && (
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
            src={aktivtBilde.bilde}
            alt="AI-generert husforslag"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
