"use client";

import { useState, useRef } from "react";
import { Download, RefreshCw, X, ArrowRight, ChevronDown } from "lucide-react";
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

const BYGNINGSTYPER = [
  { value: "enebolig", label: "Enebolig" },
  { value: "rekkehus", label: "Rekkehus" },
  { value: "blokk", label: "Leilighetsbygg" },
  { value: "naering", label: "Næringsbygg" },
  { value: "hytte", label: "Hytte / fritidsbolig" },
];

const TAKFORMER = [
  { value: "flatt", label: "Flatt tak" },
  { value: "saltak", label: "Saltak" },
  { value: "pulttak", label: "Pulttak" },
  { value: "valmtak", label: "Valmtak" },
  { value: "torvtak", label: "Torvtak / grønt tak" },
];

export function Bildegenerering({ rapport }: BildegenereringProps) {
  const [bilder, setBilder] = useState<Bilde[]>([]);
  const [valgtId, setValgtId] = useState<string>("");
  const [referansebilde, setReferansebilde] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [visFullskjerm, setVisFullskjerm] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  // User preferences
  const [bygningstype, setBygningstype] = useState("enebolig");
  const [takform, setTakform] = useState("flatt");
  const [etasjer, setEtasjer] = useState("2");
  const [bruksareal, setBruksareal] = useState("");
  const [visValg, setVisValg] = useState(true);

  const aktivtBilde = bilder.find((b) => b.id === valgtId) || bilder[0];

  // Get regulatory limits from rapport data
  const regKort = rapport.kort.find((k) => k.id === "regulering");
  const eiendomKort = rapport.kort.find((k) => k.id === "eiendom");
  const regData = regKort?.raadata;
  const maksEtasjer = regData?.maksEtasjer;
  const maksHoyde = regData?.maksHoyde;
  const maksBYA = regData?.utnyttingsgrad;
  const tomteareal = eiendomKort?.raadata?.arealKvm;
  const maksBebygget = regData?.maksBebyggetAreal;

  const generer = async () => {
    setLaster(true);
    setFeil(null);
    setVisValg(false);

    const grunnKort = rapport.kort.find((k) => k.id === "grunn");
    const solKort = rapport.kort.find((k) => k.id === "solforhold");

    try {
      const res = await fetch("/api/bildegenerering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adresse: rapport.adresse.adressetekst,
          lat: rapport.adresse.representasjonspunkt.lat,
          lon: rapport.adresse.representasjonspunkt.lon,
          tomteareal: tomteareal ? Math.round(tomteareal) : null,
          regulering: regData
            ? {
                maksEtasjer: regData.maksEtasjer,
                maksHoyde: regData.maksHoyde,
                utnyttingsgrad: regData.utnyttingsgrad,
              }
            : null,
          grunnforhold: grunnKort ? grunnKort.beskrivelse : null,
          solforhold: solKort?.raadata?.hovedretning ?? null,
          hoydeOverHavet: rapport.hoydeOverHavet,
          // User's building preferences
          bygningstype,
          brukerValg: {
            takform,
            etasjer: parseInt(etasjer) || 2,
            bruksareal: bruksareal ? parseInt(bruksareal) : null,
          },
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
    a.download = `tomtesjekk-konsept-${rapport.adresse.adressetekst.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "-")}.png`;
    a.click();
  };

  const handleSliderMove = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  };

  return (
    <section className="bg-paper-soft border border-paper-edge fade-up">
      {/* Header */}
      <div className="border-b border-paper-edge px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="label-editorial">Bygningskonsept</span>
          <h3 className="font-display text-xl text-ink tracking-tight mt-1">
            Hva kan du bygge her?
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          AI-generert · Gemini 2.5
        </span>
      </div>

      <div className="p-6 lg:p-8">
        {/* User preference form */}
        {visValg && bilder.length === 0 && !laster && (
          <div className="space-y-5">
            <p className="text-sm text-ink-soft leading-relaxed max-w-xl">
              Beskriv hva du ønsker å bygge. AI-en genererer et konsept som
              respekterer reguleringsplanens rammer
              {maksBYA ? ` (BYA ${maksBYA}%` : ""}
              {maksHoyde ? `, maks ${maksHoyde}m` : ""}
              {maksEtasjer ? `, ${maksEtasjer} etasjer` : ""}
              {maksBYA || maksHoyde || maksEtasjer ? ")" : ""} og
              tomtens grunnforhold.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {/* Bygningstype */}
              <div>
                <label className="label-editorial block mb-2">Type bygg</label>
                <select
                  value={bygningstype}
                  onChange={(e) => setBygningstype(e.target.value)}
                  className="w-full px-3 py-2.5 border border-paper-edge bg-paper text-sm text-ink focus:outline-none focus:border-ink"
                >
                  {BYGNINGSTYPER.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              {/* Takform */}
              <div>
                <label className="label-editorial block mb-2">Takform</label>
                <select
                  value={takform}
                  onChange={(e) => setTakform(e.target.value)}
                  className="w-full px-3 py-2.5 border border-paper-edge bg-paper text-sm text-ink focus:outline-none focus:border-ink"
                >
                  {TAKFORMER.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Etasjer */}
              <div>
                <label className="label-editorial block mb-2">
                  Etasjer
                  {maksEtasjer && <span className="text-ink-faint ml-1">(maks {maksEtasjer})</span>}
                </label>
                <input
                  type="number"
                  value={etasjer}
                  onChange={(e) => setEtasjer(e.target.value)}
                  min="1"
                  max={maksEtasjer || 5}
                  className="w-full px-3 py-2.5 border border-paper-edge bg-paper text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>

              {/* Bruksareal */}
              <div>
                <label className="label-editorial block mb-2">
                  Bruksareal (m²)
                  {maksBebygget && <span className="text-ink-faint ml-1">(maks {Math.round(maksBebygget)})</span>}
                </label>
                <input
                  type="number"
                  value={bruksareal}
                  onChange={(e) => setBruksareal(e.target.value)}
                  placeholder={maksBebygget ? `f.eks. ${Math.round(maksBebygget)}` : "f.eks. 150"}
                  className="w-full px-3 py-2.5 border border-paper-edge bg-paper text-sm text-ink focus:outline-none focus:border-ink placeholder:text-ink-faint"
                />
              </div>
            </div>

            <Button onClick={generer} variant="primary" size="md">
              Generer bygningskonsept
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Loading */}
        {laster && (
          <div className="flex items-center gap-3 py-8">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
            <div>
              <p className="text-sm text-ink-muted">Genererer bygningskonsept...</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mt-1">
                {bygningstype} · {takform} · {etasjer} etasjer — kan ta 30-60 sek
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {feil && (
          <div className="py-4">
            <p className="text-sm text-clay-700 mb-3">{feil}</p>
            <Button onClick={() => { setVisValg(true); setFeil(null); }} variant="outline" size="sm">
              <RefreshCw className="w-3 h-3" />
              Endre valg og prøv igjen
            </Button>
          </div>
        )}

        {/* Results */}
        {bilder.length > 0 && !laster && aktivtBilde && (
          <div className="space-y-5">
            {/* What was requested */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-ink-muted pb-3 border-b border-paper-edge">
              <span>{BYGNINGSTYPER.find(b => b.value === bygningstype)?.label}</span>
              <span className="text-ink-faint">·</span>
              <span>{TAKFORMER.find(t => t.value === takform)?.label}</span>
              <span className="text-ink-faint">·</span>
              <span>{etasjer} etasjer</span>
              {bruksareal && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span>{bruksareal} m²</span>
                </>
              )}
              <button
                onClick={() => { setVisValg(true); setBilder([]); setFeil(null); }}
                className="ml-auto text-ink-muted hover:text-clay-500 transition-colors"
              >
                Endre →
              </button>
            </div>

            {/* Angle tabs */}
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

            {/* Before/after slider */}
            {referansebilde ? (
              <div className="space-y-1.5">
                <div
                  ref={sliderRef}
                  className="relative border border-paper-edge overflow-hidden cursor-ew-resize select-none"
                  onPointerMove={handleSliderMove}
                  onPointerDown={handleSliderMove}
                >
                  <img src={referansebilde} alt="Dagens situasjon" className="w-full h-auto block" />
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={aktivtBilde.bilde}
                      alt="AI-konsept"
                      className="block max-w-none"
                      style={{ width: `${(100 / sliderPos) * 100}%`, maxWidth: "none" }}
                    />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-paper shadow-lg pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-paper rounded-full shadow-editorial-lg flex items-center justify-center border border-paper-edge">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-ink rounded-full" />
                        <div className="w-0.5 h-3 bg-ink rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-ink/70 text-paper text-[9px] font-mono uppercase tracking-wider px-2 py-1 backdrop-blur-sm">
                    AI-konsept
                  </div>
                  <div className="absolute top-2 right-2 bg-ink/70 text-paper text-[9px] font-mono uppercase tracking-wider px-2 py-1 backdrop-blur-sm">
                    Dagens situasjon
                  </div>
                </div>
                <p className="text-[10px] text-ink-faint text-center italic">
                  Dra i slideren for å sammenligne
                </p>
              </div>
            ) : (
              <button
                onClick={() => setVisFullskjerm(true)}
                className="block w-full border border-paper-edge overflow-hidden cursor-zoom-in hover:opacity-95 transition-opacity"
              >
                <img src={aktivtBilde.bilde} alt="AI-konsept" className="w-full h-auto" />
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
                Generer på nytt
              </Button>
              <Button onClick={lastNed} variant="ghost" size="sm">
                <Download className="w-3 h-3" />
                Last ned
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen */}
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
            alt="AI-konsept"
            className="max-w-full max-h-full shadow-editorial-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
