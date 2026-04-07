"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import L from "leaflet";
import { cn } from "@/lib/utils";

interface Kommune {
  kommunenummer: string;
  kommunenavn: string;
}

interface Resultat {
  id: string;
  lat: number;
  lon: number;
  adresse: string;
  arealformaal: string;
  planNavn: string | null;
  analyseKort: Array<{ kategori: string; status: string; detaljer: string }>;
  poeng: number;
  begrunnelse: string;
}

interface StatusMelding {
  type: string;
  melding: string;
  antall?: number;
}

const BYGNINGSTYPER = [
  { value: "enebolig", label: "Enebolig" },
  { value: "rekkehus", label: "Rekkehus / tomannsbolig" },
  { value: "blokk", label: "Leilighetsbygg / blokk" },
  { value: "naering", label: "Næringsbygg" },
  { value: "hytte", label: "Hytte / fritidsbolig" },
  { value: "annet", label: "Annet" },
];

function poengFarge(poeng: number): string {
  if (poeng >= 75) return "text-emerald-600";
  if (poeng >= 50) return "text-amber-600";
  return "text-red-500";
}

function poengBg(poeng: number): string {
  if (poeng >= 75) return "bg-emerald-100 ring-emerald-400";
  if (poeng >= 50) return "bg-amber-100 ring-amber-400";
  return "bg-red-100 ring-red-400";
}

export default function TomtefinnerView() {
  // Form state
  const [kommuneSok, setKommuneSok] = useState("");
  const [kommuneForslag, setKommuneForslag] = useState<Kommune[]>([]);
  const [valgtKommune, setValgtKommune] = useState<Kommune | null>(null);
  const [bygningstype, setBygningstype] = useState("enebolig");
  const [arealMin, setArealMin] = useState("");
  const [arealMax, setArealMax] = useState("");
  const [etasjer, setEtasjer] = useState("");
  const [lavRisiko, setLavRisiko] = useState(true);
  const [stille, setStille] = useState(false);
  const [veinaerhet, setVeinaerhet] = useState(false);

  // Search state
  const [soker, setSoker] = useState(false);
  const [statusMeldinger, setStatusMeldinger] = useState<StatusMelding[]>([]);
  const [resultater, setResultater] = useState<Resultat[]>([]);
  const [ferdig, setFerdig] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  // Map state
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Invalidate map size when layout changes or window resizes
  useEffect(() => {
    if (!mapRef.current) return;
    const invalidate = () => {
      mapRef.current?.invalidateSize();
    };
    // Multiple delayed invalidations to handle layout settling
    const timers = [50, 200, 500, 1000].map((ms) => setTimeout(invalidate, ms));
    window.addEventListener("resize", invalidate);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", invalidate);
    };
  }, [resultater, soker, ferdig]);

  // Kommune search
  const sisteForslag = useRef<Kommune[]>([]);

  const sokKommune = useCallback(async (tekst: string) => {
    setKommuneSok(tekst);
    setValgtKommune(null);
    if (tekst.length < 2) {
      setKommuneForslag([]);
      sisteForslag.current = [];
      return;
    }
    try {
      const res = await fetch(
        `https://ws.geonorge.no/kommuneinfo/v1/sok?knavn=${encodeURIComponent(tekst)}`
      );
      const data = await res.json();
      const kommuner = data?.kommuner || data || [];
      const forslag = (Array.isArray(kommuner) ? kommuner : []).slice(0, 8).map((k: any) => ({
        kommunenummer: k.kommunenummer,
        kommunenavn: k.kommunenavnNorsk || k.kommunenavn,
      }));
      setKommuneForslag(forslag);
      sisteForslag.current = forslag;

      // Auto-select if exact match, but keep dropdown visible briefly
      const eksakt = forslag.find(
        (k: Kommune) => k.kommunenavn.toLowerCase() === tekst.toLowerCase()
      );
      if (eksakt) {
        setValgtKommune(eksakt);
      }
    } catch {
      setKommuneForslag([]);
    }
  }, []);

  const velgKommune = (kommune: Kommune) => {
    setValgtKommune(kommune);
    setKommuneSok(kommune.kommunenavn);
    setKommuneForslag([]);
  };

  // Auto-select first suggestion if user hasn't picked one
  const autoVelgKommune = useCallback(async () => {
    if (valgtKommune) return;
    // Check latest suggestions
    if (sisteForslag.current.length > 0) {
      velgKommune(sisteForslag.current[0]);
      return;
    }
    // Try a fresh lookup
    if (kommuneSok.length >= 2) {
      try {
        const res = await fetch(
          `https://ws.geonorge.no/kommuneinfo/v1/sok?knavn=${encodeURIComponent(kommuneSok)}`
        );
        const data = await res.json();
        if (data?.[0]) {
          velgKommune({
            kommunenummer: data[0].kommunenummer,
            kommunenavn: data[0].kommunenavnNorsk || data[0].kommunenavn,
          });
        }
      } catch {}
    }
  }, [valgtKommune, kommuneSok]);

  // Initialize map
  const initKart = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [65.0, 13.0],
      zoom: 5,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Watch container for size changes (Leaflet doesn't do this automatically)
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      const ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(mapContainerRef.current);
    }

    // Initial size invalidation after layout
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
  }, []);

  // Clear map markers
  const fjernMarkorer = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  // Add a numbered marker to map
  const leggTilMarkor = (lat: number, lon: number, nummer: number, poeng: number, adresse: string) => {
    if (!mapRef.current) return;
    const farge = poeng >= 75 ? "#10b981" : poeng >= 50 ? "#f59e0b" : "#ef4444";
    const icon = L.divIcon({
      html: `<div style="background:${farge};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${nummer}</div>`,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const marker = L.marker([lat, lon], { icon })
      .bindPopup(`<b>#${nummer}</b><br>${adresse}<br>Poeng: ${poeng}/100`)
      .addTo(mapRef.current);
    markersRef.current.push(marker);
  };

  // Start search
  const startSok = useCallback(async () => {
    // Auto-select municipality if user typed but didn't pick from list
    let kommune = valgtKommune;
    if (!kommune && kommuneSok.length >= 2) {
      if (sisteForslag.current.length > 0) {
        kommune = sisteForslag.current[0];
      } else {
        try {
          const res = await fetch(
            `https://ws.geonorge.no/kommuneinfo/v1/sok?knavn=${encodeURIComponent(kommuneSok)}`
          );
          const data = await res.json();
          const kommuner = data?.kommuner || data || [];
          const forsteTreff = Array.isArray(kommuner) ? kommuner[0] : null;
          if (forsteTreff) {
            kommune = {
              kommunenummer: forsteTreff.kommunenummer,
              kommunenavn: forsteTreff.kommunenavnNorsk || forsteTreff.kommunenavn,
            };
          }
        } catch {}
      }
      if (kommune) {
        setValgtKommune(kommune);
        setKommuneSok(kommune.kommunenavn);
        setKommuneForslag([]);
      }
    }
    if (!kommune) return;

    setSoker(true);
    setFerdig(false);
    setFeil(null);
    setStatusMeldinger([]);
    setResultater([]);
    fjernMarkorer();

    // Initialize map if not already
    setTimeout(() => {
      initKart();
      // Invalidate size after render
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }, 50);

    try {
      const res = await fetch("/api/tomtefinner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kommunenummer: kommune.kommunenummer,
          kommunenavn: kommune.kommunenavn,
          bygningstype,
          arealMin: arealMin ? parseInt(arealMin) : undefined,
          arealMax: arealMax ? parseInt(arealMax) : undefined,
          etasjer: etasjer ? parseInt(etasjer) : undefined,
          preferanser: {
            lavRisiko,
            stille,
            veinaerhet,
          },
        }),
      });

      if (!res.ok || !res.body) {
        setFeil("Nettverksfeil — prøv igjen");
        setSoker(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === "status") {
              setStatusMeldinger((prev) => [...prev, data]);
            } else if (data.type === "kandidater_funnet") {
              setStatusMeldinger((prev) => [...prev, data]);
            } else if (data.type === "kandidat_analysert") {
              // Add marker to map progressively
              const currentCount = markersRef.current.length + 1;
              leggTilMarkor(data.lat, data.lon, currentCount, 50, data.adresse);
              if (mapRef.current && currentCount === 1) {
                mapRef.current.flyTo([data.lat, data.lon], 11, { duration: 1.5 });
              }
            } else if (data.type === "feil") {
              setFeil(data.melding);
            } else if (data.type === "ferdig") {
              // Replace preliminary markers with scored ones
              fjernMarkorer();
              const sortert = data.resultater || [];
              setResultater(sortert);

              sortert.forEach((r: Resultat, i: number) => {
                leggTilMarkor(r.lat, r.lon, i + 1, r.poeng, r.adresse);
              });

              // Fit map to all markers
              if (mapRef.current && sortert.length > 0) {
                const bounds = L.latLngBounds(sortert.map((r: Resultat) => [r.lat, r.lon]));
                mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
              }

              setFerdig(true);
            }
          } catch {
            // Ignore malformed lines
          }
        }
      }
    } catch {
      setFeil("Nettverksfeil — prøv igjen");
    } finally {
      setSoker(false);
    }
  }, [valgtKommune, bygningstype, arealMin, arealMax, etasjer, lavRisiko, stille, veinaerhet, initKart]);

  const harResultater = resultater.length > 0 || soker;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-gray-400 hover:text-fjord-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-fjord-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-fjord-500">
                  AI Tomtefinner
                </h1>
                <p className="text-xs text-gray-500">
                  Finn den beste tomten for ditt byggeprosjekt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={cn("flex gap-6", harResultater ? "flex-col lg:flex-row" : "flex-col items-center")}>
          {/* Form */}
          <div className={cn(
            "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
            harResultater ? "lg:w-[380px] lg:shrink-0" : "w-full max-w-2xl"
          )}>
            <h2 className="font-display font-bold text-lg text-fjord-700 mb-4">
              Hva vil du bygge?
            </h2>

            <div className="space-y-4">
              {/* Kommune */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kommune
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={kommuneSok}
                    onChange={(e) => sokKommune(e.target.value)}
                    placeholder="Søk etter kommune..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fjord-500 focus:border-fjord-500 outline-none"
                    disabled={soker}
                  />
                </div>
                {kommuneForslag.length > 0 && !valgtKommune && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {kommuneForslag.map((k) => (
                      <button
                        key={k.kommunenummer}
                        onClick={() => velgKommune(k)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-fjord-50 transition-colors flex items-center justify-between"
                      >
                        <span>
                          {k.kommunenavn}
                          <span className="text-xs text-gray-400 ml-2">
                            ({k.kommunenummer})
                          </span>
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
                {valgtKommune && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">
                      {valgtKommune.kommunenavn} ({valgtKommune.kommunenummer})
                    </p>
                  </div>
                )}
              </div>

              {/* Bygningstype */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bygningstype
                </label>
                <select
                  value={bygningstype}
                  onChange={(e) => setBygningstype(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fjord-500 focus:border-fjord-500 outline-none bg-white"
                  disabled={soker}
                >
                  {BYGNINGSTYPER.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              {/* Areal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. areal (m²)
                  </label>
                  <input
                    type="number"
                    value={arealMin}
                    onChange={(e) => setArealMin(e.target.value)}
                    placeholder="f.eks. 500"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fjord-500 focus:border-fjord-500 outline-none"
                    disabled={soker}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maks areal (m²)
                  </label>
                  <input
                    type="number"
                    value={arealMax}
                    onChange={(e) => setArealMax(e.target.value)}
                    placeholder="f.eks. 2000"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fjord-500 focus:border-fjord-500 outline-none"
                    disabled={soker}
                  />
                </div>
              </div>

              {/* Etasjer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Antall etasjer
                </label>
                <input
                  type="number"
                  value={etasjer}
                  onChange={(e) => setEtasjer(e.target.value)}
                  placeholder="f.eks. 2"
                  min="1"
                  max="10"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fjord-500 focus:border-fjord-500 outline-none"
                  disabled={soker}
                />
              </div>

              {/* Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferanser
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lavRisiko}
                      onChange={(e) => setLavRisiko(e.target.checked)}
                      className="rounded border-gray-300 text-fjord-500 focus:ring-fjord-500"
                      disabled={soker}
                    />
                    Lav naturfare (flom, skred, kvikkleire)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stille}
                      onChange={(e) => setStille(e.target.checked)}
                      className="rounded border-gray-300 text-fjord-500 focus:ring-fjord-500"
                      disabled={soker}
                    />
                    Stille område (lite støy)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={veinaerhet}
                      onChange={(e) => setVeinaerhet(e.target.checked)}
                      className="rounded border-gray-300 text-fjord-500 focus:ring-fjord-500"
                      disabled={soker}
                    />
                    Nær offentlig vei
                  </label>
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={startSok}
                disabled={(!valgtKommune && kommuneSok.length < 2) || soker}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-fjord-500 text-white rounded-lg font-semibold hover:bg-fjord-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {soker ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Søker...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Finn tomter
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results area */}
          {harResultater && (
            <div className="flex-1 min-w-0 space-y-4">
              {/* Map */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div ref={mapContainerRef} className="w-full h-[400px] lg:h-[450px]" />
              </div>

              {/* Status messages */}
              {soker && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="space-y-2">
                    {statusMeldinger.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        {i === statusMeldinger.length - 1 && soker ? (
                          <div className="w-3.5 h-3.5 border-2 border-fjord-200 border-t-fjord-500 rounded-full animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shrink-0" />
                        )}
                        {s.melding}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {feil && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {feil}
                </div>
              )}

              {/* Result cards */}
              {ferdig && resultater.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-fjord-700">
                    {resultater.length} tomteområder funnet
                  </h3>
                  {resultater.map((r, i) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        mapRef.current?.flyTo([r.lat, r.lon], 15, { duration: 1 });
                        markersRef.current[i]?.openPopup();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Number badge */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-2 shrink-0",
                          poengBg(r.poeng),
                          poengFarge(r.poeng)
                        )}>
                          {i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {r.adresse}
                            </h4>
                            <span className={cn(
                              "text-sm font-bold shrink-0",
                              poengFarge(r.poeng)
                            )}>
                              {r.poeng}/100
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.arealformaal}
                            {r.planNavn && ` — ${r.planNavn}`}
                          </p>

                          <p className="text-sm text-gray-700 mt-2">
                            {r.begrunnelse}
                          </p>

                          {/* Mini analysis summary */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {r.analyseKort.map((k, j) => (
                              <span
                                key={j}
                                className="inline-block px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded-full"
                                title={k.detaljer}
                              >
                                {k.kategori}: {k.status}
                              </span>
                            ))}
                          </div>

                          {/* Link to full analysis */}
                          <Link
                            href={`/analyser?lat=${r.lat}&lon=${r.lon}`}
                            className="inline-flex items-center gap-1 text-xs text-fjord-500 hover:text-fjord-600 mt-2 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Full tomteanalyse
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {ferdig && resultater.length === 0 && !feil && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                  <p className="text-gray-500">
                    Ingen tomteområder funnet som matcher kravene dine. Prøv en annen kommune eller bygningstype.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
