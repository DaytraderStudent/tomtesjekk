"use client";

import { useState } from "react";
import { Sparkles, Download, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rapport } from "@/types";

interface BildegenereringProps {
  rapport: Rapport;
}

export function Bildegenerering({ rapport }: BildegenereringProps) {
  const [bilde, setBilde] = useState<string | null>(null);
  const [beskrivelse, setBeskrivelse] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [visFullskjerm, setVisFullskjerm] = useState(false);

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
      } else {
        setBilde(data.bilde);
        setBeskrivelse(data.beskrivelse);
      }
    } catch {
      setFeil("Nettverksfeil — prøv igjen");
    } finally {
      setLaster(false);
    }
  };

  const lastNed = () => {
    if (!bilde) return;
    const a = document.createElement("a");
    a.href = bilde;
    a.download = `tomtesjekk-${rapport.adresse.adressetekst.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "-")}.png`;
    a.click();
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
          Generer et forslag til hvordan et hus kan se ut på denne tomten
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {!bilde && !laster && (
          <button
            onClick={generer}
            disabled={laster}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-fjord-500 to-fjord-600 text-white rounded-lg font-semibold hover:from-fjord-600 hover:to-fjord-700 transition-all text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generer husforslag
          </button>
        )}

        {laster && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-3 border-fjord-200 border-t-fjord-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Genererer bilde med AI...</p>
            <p className="text-xs text-gray-400">Dette kan ta 10-20 sekunder</p>
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

        {bilde && !laster && (
          <div className="space-y-3">
            {/* Image */}
            <button
              onClick={() => setVisFullskjerm(true)}
              className="block w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-zoom-in"
            >
              <img
                src={bilde}
                alt="AI-generert husforslag"
                className="w-full h-auto"
              />
            </button>

            {/* Description */}
            {beskrivelse && (
              <p className="text-xs text-gray-500 leading-relaxed">
                {beskrivelse}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={generer}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-fjord-600 border border-fjord-200 rounded-lg hover:bg-fjord-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nytt forslag
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
      {visFullskjerm && bilde && (
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
            src={bilde}
            alt="AI-generert husforslag"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
