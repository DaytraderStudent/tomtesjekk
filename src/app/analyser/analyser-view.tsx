"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { MapPin, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Adressesok } from "@/components/Adressesok";
import { Kart } from "@/components/Kart";
import { Fremdriftslinje } from "@/components/Fremdriftslinje";
import { Rapport } from "@/components/Rapport";
import { STEG_NAVN } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  flomStatus,
  skredStatus,
  kvikkleireStatus,
  radonStatus,
  grunnStatus,
  nvdbStatus,
} from "@/lib/trafikklys";
import type {
  KartverketAdresse,
  AnalyseSteg,
  AnalyseKort,
  Rapport as RapportType,
  NveResultat,
  NguRadonResultat,
  NguGrunnResultat,
  SsbResultat,
  NvdbResultat,
} from "@/types";

function lagInitielleSteg(): AnalyseSteg[] {
  return Object.entries(STEG_NAVN).map(([id, navn]) => ({
    id,
    navn,
    status: "venter",
  }));
}

export default function AnalyserView() {
  const [valgtAdresse, setValgtAdresse] = useState<KartverketAdresse | null>(null);
  const [rapport, setRapport] = useState<RapportType | null>(null);
  const [steg, setSteg] = useState<AnalyseSteg[]>(lagInitielleSteg());
  const [prosent, setProsent] = useState(0);
  const [erAktiv, setErAktiv] = useState(false);
  const [panelApen, setPanelApen] = useState(true);

  const oppdaterSteg = (id: string, status: AnalyseSteg["status"], feilmelding?: string) => {
    setSteg((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, feilmelding } : s))
    );
  };

  const startAnalyse = useCallback(async (adresse: KartverketAdresse) => {
    setErAktiv(true);
    setRapport(null);
    setPanelApen(true);
    setSteg(lagInitielleSteg());
    setProsent(0);

    const { lat, lon } = adresse.representasjonspunkt;
    const kort: AnalyseKort[] = [];

    oppdaterSteg("adresse", "aktiv");
    setProsent(5);
    await new Promise((r) => setTimeout(r, 300));
    oppdaterSteg("adresse", "ferdig");
    setProsent(15);

    oppdaterSteg("nve", "aktiv");
    try {
      const res = await fetch(`/api/nve?lat=${lat}&lon=${lon}`);
      const nve: NveResultat = await res.json();

      if (nve.flom) {
        const fs = flomStatus(nve.flom);
        kort.push({
          id: "flom", tittel: "Flomfare", beskrivelse: fs.tekst,
          detaljer: nve.flom.detaljer || "", status: fs.status,
          statusTekst: fs.tekst, kilde: "NVE", kildeUrl: "https://nve.no",
        });
      }
      if (nve.skred) {
        const ss = skredStatus(nve.skred);
        kort.push({
          id: "skred", tittel: "Skredfare", beskrivelse: ss.tekst,
          detaljer: nve.skred.detaljer || "", status: ss.status,
          statusTekst: ss.tekst, kilde: "NVE", kildeUrl: "https://nve.no",
        });
      }
      if (nve.kvikkleire) {
        const ks = kvikkleireStatus(nve.kvikkleire);
        kort.push({
          id: "kvikkleire", tittel: "Kvikkleire", beskrivelse: ks.tekst,
          detaljer: nve.kvikkleire.detaljer || "", status: ks.status,
          statusTekst: ks.tekst, kilde: "NVE", kildeUrl: "https://nve.no",
        });
      }
      oppdaterSteg("nve", "ferdig");
    } catch {
      oppdaterSteg("nve", "feil", "Kunne ikke hente NVE-data");
    }
    setProsent(30);

    oppdaterSteg("radon", "aktiv");
    oppdaterSteg("grunn", "aktiv");
    oppdaterSteg("ssb", "aktiv");
    oppdaterSteg("nvdb", "aktiv");

    const [radonRes, grunnRes, ssbRes, nvdbRes] = await Promise.allSettled([
      fetch(`/api/ngu-radon?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch(`/api/ngu-grunn?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch("/api/ssb").then((r) => r.json()),
      fetch(`/api/nvdb?lat=${lat}&lon=${lon}`).then((r) => r.json()),
    ]);

    if (radonRes.status === "fulfilled" && !radonRes.value.error) {
      const data: NguRadonResultat = radonRes.value;
      const rs = radonStatus(data);
      kort.push({
        id: "radon", tittel: "Radon", beskrivelse: rs.tekst,
        detaljer: data.detaljer || "", status: rs.status,
        statusTekst: rs.tekst, kilde: "NGU", kildeUrl: "https://ngu.no",
      });
      oppdaterSteg("radon", "ferdig");
    } else {
      oppdaterSteg("radon", "feil", "Kunne ikke hente radondata");
    }
    setProsent(50);

    if (grunnRes.status === "fulfilled" && !grunnRes.value.error) {
      const data: NguGrunnResultat = grunnRes.value;
      const gs = grunnStatus(data);
      kort.push({
        id: "grunn", tittel: "Grunnforhold", beskrivelse: gs.tekst,
        detaljer: data.detaljer || "", status: gs.status,
        statusTekst: gs.tekst, kilde: "NGU", kildeUrl: "https://ngu.no",
      });
      oppdaterSteg("grunn", "ferdig");
    } else {
      oppdaterSteg("grunn", "feil", "Kunne ikke hente grunndata");
    }
    setProsent(65);

    if (ssbRes.status === "fulfilled" && !ssbRes.value.error) {
      const data: SsbResultat = ssbRes.value;
      const trend = data.endringProsent > 2 ? "gul" as const : "gronn" as const;
      kort.push({
        id: "ssb", tittel: "Byggekostnader",
        beskrivelse: `Indeks: ${data.indeksverdi} (${data.periode})`,
        detaljer: data.detaljer || "", status: trend,
        statusTekst: data.endringProsent > 2
          ? `Stigende kostnader (+${data.endringProsent}%)`
          : `Stabile kostnader (${data.endringProsent > 0 ? "+" : ""}${data.endringProsent}%)`,
        kilde: "SSB", kildeUrl: "https://ssb.no",
      });
      oppdaterSteg("ssb", "ferdig");
    } else {
      oppdaterSteg("ssb", "feil", "Kunne ikke hente SSB-data");
    }
    setProsent(75);

    if (nvdbRes.status === "fulfilled" && !nvdbRes.value.error) {
      const data: NvdbResultat = nvdbRes.value;
      const ns = nvdbStatus(data);
      kort.push({
        id: "nvdb", tittel: "Veitilgang", beskrivelse: ns.tekst,
        detaljer: data.detaljer || "", status: ns.status,
        statusTekst: ns.tekst, kilde: "Statens vegvesen",
        kildeUrl: "https://nvdbapiles-v3.atlas.vegvesen.no",
      });
      oppdaterSteg("nvdb", "ferdig");
    } else {
      oppdaterSteg("nvdb", "feil", "Kunne ikke hente NVDB-data");
    }
    setProsent(85);

    oppdaterSteg("ai", "aktiv");
    let aiOppsummering = null;
    try {
      const aiRes = await fetch("/api/rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adresse: adresse.adressetekst,
          analysedata: kort.map((k) => ({
            kategori: k.tittel, status: k.statusTekst, detaljer: k.detaljer,
          })),
        }),
      });
      const aiData = await aiRes.json();
      if (aiData.tekst) {
        aiOppsummering = { tekst: aiData.tekst, generert: aiData.generert };
        oppdaterSteg("ai", "ferdig");
      } else {
        oppdaterSteg("ai", "feil", "AI-oppsummering utilgjengelig");
      }
    } catch {
      oppdaterSteg("ai", "feil", "Kunne ikke generere AI-oppsummering");
    }
    setProsent(100);

    setRapport({
      adresse, kort, aiOppsummering, tidspunkt: new Date().toISOString(),
    });

    setErAktiv(false);
    toast.success("Analyse ferdig!");
  }, []);

  const handleVelgAdresse = (adresse: KartverketAdresse) => {
    setValgtAdresse(adresse);
  };

  const handleKlikkKart = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/adresse?sok=${lat},${lon}`);
      const data = await res.json();
      if (data.adresser && data.adresser.length > 0) {
        setValgtAdresse(data.adresser[0]);
      } else {
        setValgtAdresse({
          adressetekst: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          poststed: "", postnummer: "", kommunenavn: "", kommunenummer: "",
          representasjonspunkt: { lat, lon },
        });
      }
    } catch {
      setValgtAdresse({
        adressetekst: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        poststed: "", postnummer: "", kommunenavn: "", kommunenummer: "",
        representasjonspunkt: { lat, lon },
      });
    }
  };

  const harPanel = erAktiv || rapport;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <Kart
          lat={valgtAdresse?.representasjonspunkt.lat}
          lon={valgtAdresse?.representasjonspunkt.lon}
          onKlikkKart={handleKlikkKart}
        />
      </div>

      {/* Top bar: logo + search */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="flex items-start gap-3 p-4 max-w-4xl mx-auto">
          {/* Logo pill */}
          <a
            href="/"
            className="pointer-events-auto flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-fjord-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-fjord-500 hidden sm:inline">
              Tomtesjekk
            </span>
          </a>

          {/* Search + button */}
          <div className="pointer-events-auto flex-1 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200">
              <Adressesok onVelgAdresse={handleVelgAdresse} disabled={erAktiv} />
            </div>
            <button
              onClick={() => valgtAdresse && startAnalyse(valgtAdresse)}
              disabled={!valgtAdresse || erAktiv}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-fjord-500 text-white rounded-xl font-semibold hover:bg-fjord-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg whitespace-nowrap"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">
                {erAktiv ? "Analyserer..." : "Analyser tomt"}
              </span>
            </button>
          </div>
        </div>

        {/* Selected address chip */}
        {valgtAdresse && !erAktiv && !rapport && (
          <div className="flex justify-center px-4 -mt-1">
            <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm border border-fjord-100 rounded-full shadow-md">
              <MapPin className="w-3.5 h-3.5 text-fjord-500" />
              <span className="text-sm text-fjord-700">
                <strong>{valgtAdresse.adressetekst}</strong>
                {valgtAdresse.kommunenavn && `, ${valgtAdresse.kommunenavn}`}
              </span>
              <span className="text-xs text-fjord-400 ml-1">— klikk Analyser</span>
            </div>
          </div>
        )}
      </div>

      {/* Report panel — slides up from right side on desktop, bottom on mobile */}
      {harPanel && (
        <div
          className={cn(
            "absolute z-[1000] pointer-events-none",
            // Mobile: bottom sheet
            "bottom-0 left-0 right-0",
            // Desktop: right sidebar
            "lg:top-0 lg:right-0 lg:left-auto lg:bottom-0 lg:w-[440px]"
          )}
        >
          <div
            className={cn(
              "pointer-events-auto flex flex-col",
              // Mobile: max 60% height bottom sheet
              "max-h-[60vh]",
              // Desktop: full height sidebar
              "lg:max-h-full lg:h-full"
            )}
          >
            {/* Collapse/expand toggle */}
            <button
              onClick={() => setPanelApen(!panelApen)}
              className="mx-auto lg:mx-0 lg:ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-t-xl border border-b-0 border-gray-200 shadow-lg text-sm text-gray-600 hover:text-fjord-600 transition-colors"
            >
              {panelApen ? (
                <>
                  <ChevronDown className="w-4 h-4 lg:hidden" />
                  <X className="w-4 h-4 hidden lg:block" />
                  <span>Skjul</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 lg:hidden" />
                  <ChevronUp className="w-4 h-4 hidden lg:block" />
                  <span>{rapport ? "Vis rapport" : "Vis fremdrift"}</span>
                </>
              )}
            </button>

            {panelApen && (
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl overflow-y-auto rounded-t-2xl lg:rounded-none lg:rounded-l-2xl lg:border-r-0 p-5">
                {erAktiv && (
                  <div>
                    <h2 className="font-display text-lg font-bold text-fjord-500 mb-4">
                      Analyserer...
                    </h2>
                    <Fremdriftslinje steg={steg} prosent={prosent} />
                  </div>
                )}
                {rapport && !erAktiv && <Rapport rapport={rapport} />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
