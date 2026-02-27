"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Adressesok } from "@/components/Adressesok";
import { Kart } from "@/components/Kart";
import { Fremdriftslinje } from "@/components/Fremdriftslinje";
import { Rapport } from "@/components/Rapport";
import { STEG_NAVN } from "@/lib/constants";
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

  const oppdaterSteg = (id: string, status: AnalyseSteg["status"], feilmelding?: string) => {
    setSteg((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, feilmelding } : s))
    );
  };

  const startAnalyse = useCallback(async (adresse: KartverketAdresse) => {
    setErAktiv(true);
    setRapport(null);
    setSteg(lagInitielleSteg());
    setProsent(0);

    const { lat, lon } = adresse.representasjonspunkt;
    const kort: AnalyseKort[] = [];

    // Step 1: Address confirmed
    oppdaterSteg("adresse", "aktiv");
    setProsent(5);
    await new Promise((r) => setTimeout(r, 300));
    oppdaterSteg("adresse", "ferdig");
    setProsent(15);

    // Step 2: NVE (flood + landslide + quick clay)
    oppdaterSteg("nve", "aktiv");
    try {
      const res = await fetch(`/api/nve?lat=${lat}&lon=${lon}`);
      const nve: NveResultat = await res.json();

      if (nve.flom) {
        const fs = flomStatus(nve.flom);
        kort.push({
          id: "flom",
          tittel: "Flomfare",
          beskrivelse: fs.tekst,
          detaljer: nve.flom.detaljer || "",
          status: fs.status,
          statusTekst: fs.tekst,
          kilde: "NVE",
          kildeUrl: "https://nve.no",
        });
      }

      if (nve.skred) {
        const ss = skredStatus(nve.skred);
        kort.push({
          id: "skred",
          tittel: "Skredfare",
          beskrivelse: ss.tekst,
          detaljer: nve.skred.detaljer || "",
          status: ss.status,
          statusTekst: ss.tekst,
          kilde: "NVE",
          kildeUrl: "https://nve.no",
        });
      }

      if (nve.kvikkleire) {
        const ks = kvikkleireStatus(nve.kvikkleire);
        kort.push({
          id: "kvikkleire",
          tittel: "Kvikkleire",
          beskrivelse: ks.tekst,
          detaljer: nve.kvikkleire.detaljer || "",
          status: ks.status,
          statusTekst: ks.tekst,
          kilde: "NVE",
          kildeUrl: "https://nve.no",
        });
      }

      oppdaterSteg("nve", "ferdig");
    } catch {
      oppdaterSteg("nve", "feil", "Kunne ikke hente NVE-data");
    }
    setProsent(30);

    // Steps 3-6: Parallel (radon, grunn, SSB, NVDB)
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

    // Radon
    if (radonRes.status === "fulfilled" && !radonRes.value.error) {
      const data: NguRadonResultat = radonRes.value;
      const rs = radonStatus(data);
      kort.push({
        id: "radon",
        tittel: "Radon",
        beskrivelse: rs.tekst,
        detaljer: data.detaljer || "",
        status: rs.status,
        statusTekst: rs.tekst,
        kilde: "NGU",
        kildeUrl: "https://ngu.no",
      });
      oppdaterSteg("radon", "ferdig");
    } else {
      oppdaterSteg("radon", "feil", "Kunne ikke hente radondata");
    }
    setProsent(50);

    // Ground conditions
    if (grunnRes.status === "fulfilled" && !grunnRes.value.error) {
      const data: NguGrunnResultat = grunnRes.value;
      const gs = grunnStatus(data);
      kort.push({
        id: "grunn",
        tittel: "Grunnforhold",
        beskrivelse: gs.tekst,
        detaljer: data.detaljer || "",
        status: gs.status,
        statusTekst: gs.tekst,
        kilde: "NGU",
        kildeUrl: "https://ngu.no",
      });
      oppdaterSteg("grunn", "ferdig");
    } else {
      oppdaterSteg("grunn", "feil", "Kunne ikke hente grunndata");
    }
    setProsent(65);

    // Building cost index
    if (ssbRes.status === "fulfilled" && !ssbRes.value.error) {
      const data: SsbResultat = ssbRes.value;
      const trend = data.endringProsent > 2 ? "gul" as const : "gronn" as const;
      kort.push({
        id: "ssb",
        tittel: "Byggekostnader",
        beskrivelse: `Indeks: ${data.indeksverdi} (${data.periode})`,
        detaljer: data.detaljer || "",
        status: trend,
        statusTekst:
          data.endringProsent > 2
            ? `Stigende kostnader (+${data.endringProsent}%)`
            : `Stabile kostnader (${data.endringProsent > 0 ? "+" : ""}${data.endringProsent}%)`,
        kilde: "SSB",
        kildeUrl: "https://ssb.no",
      });
      oppdaterSteg("ssb", "ferdig");
    } else {
      oppdaterSteg("ssb", "feil", "Kunne ikke hente SSB-data");
    }
    setProsent(75);

    // Road access
    if (nvdbRes.status === "fulfilled" && !nvdbRes.value.error) {
      const data: NvdbResultat = nvdbRes.value;
      const ns = nvdbStatus(data);
      kort.push({
        id: "nvdb",
        tittel: "Veitilgang",
        beskrivelse: ns.tekst,
        detaljer: data.detaljer || "",
        status: ns.status,
        statusTekst: ns.tekst,
        kilde: "Statens vegvesen",
        kildeUrl: "https://nvdbapiles-v3.atlas.vegvesen.no",
      });
      oppdaterSteg("nvdb", "ferdig");
    } else {
      oppdaterSteg("nvdb", "feil", "Kunne ikke hente NVDB-data");
    }
    setProsent(85);

    // Step 7: AI Summary
    oppdaterSteg("ai", "aktiv");
    let aiOppsummering = null;
    try {
      const aiRes = await fetch("/api/rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adresse: adresse.adressetekst,
          analysedata: kort.map((k) => ({
            kategori: k.tittel,
            status: k.statusTekst,
            detaljer: k.detaljer,
          })),
        }),
      });
      const aiData = await aiRes.json();
      if (aiData.tekst) {
        aiOppsummering = {
          tekst: aiData.tekst,
          generert: aiData.generert,
        };
        oppdaterSteg("ai", "ferdig");
      } else {
        oppdaterSteg("ai", "feil", "AI-oppsummering utilgjengelig");
      }
    } catch {
      oppdaterSteg("ai", "feil", "Kunne ikke generere AI-oppsummering");
    }
    setProsent(100);

    setRapport({
      adresse,
      kort,
      aiOppsummering,
      tidspunkt: new Date().toISOString(),
    });

    setErAktiv(false);
    toast.success("Analyse ferdig!");
  }, []);

  const handleVelgAdresse = (adresse: KartverketAdresse) => {
    setValgtAdresse(adresse);
  };

  const handleKlikkKart = async (lat: number, lon: number) => {
    // Reverse geocode via Kartverket
    try {
      const res = await fetch(`/api/adresse?sok=${lat},${lon}`);
      const data = await res.json();
      if (data.adresser && data.adresser.length > 0) {
        const adresse = data.adresser[0];
        setValgtAdresse(adresse);
      } else {
        // Create a placeholder address from coordinates
        setValgtAdresse({
          adressetekst: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          poststed: "",
          postnummer: "",
          kommunenavn: "",
          kommunenummer: "",
          representasjonspunkt: { lat, lon },
        });
      }
    } catch {
      setValgtAdresse({
        adressetekst: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        poststed: "",
        postnummer: "",
        kommunenavn: "",
        kommunenummer: "",
        representasjonspunkt: { lat, lon },
      });
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Adressesok onVelgAdresse={handleVelgAdresse} disabled={erAktiv} />
            </div>
            <button
              onClick={() => valgtAdresse && startAnalyse(valgtAdresse)}
              disabled={!valgtAdresse || erAktiv}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-fjord-500 text-white rounded-xl font-semibold hover:bg-fjord-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <Search className="w-5 h-5" />
              {erAktiv ? "Analyserer..." : "Analyser tomt"}
            </button>
          </div>

          {/* Selected address indicator */}
          {valgtAdresse && !erAktiv && !rapport && (
            <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-fjord-50 border border-fjord-100 rounded-xl">
              <MapPin className="w-4 h-4 text-fjord-500" />
              <span className="text-sm text-fjord-700">
                Valgt: <strong>{valgtAdresse.adressetekst}</strong>
                {valgtAdresse.kommunenavn && `, ${valgtAdresse.kommunenavn}`}
              </span>
            </div>
          )}

          {/* Split layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map */}
            <div className="lg:w-1/2">
              <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-[500px] lg:h-[calc(100vh-160px)]">
                <Kart
                  lat={valgtAdresse?.representasjonspunkt.lat}
                  lon={valgtAdresse?.representasjonspunkt.lon}
                  onKlikkKart={handleKlikkKart}
                />
              </div>
            </div>

            {/* Report panel */}
            <div className="lg:w-1/2">
              {erAktiv && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-display text-lg font-bold text-fjord-500 mb-4">
                    Analyserer...
                  </h2>
                  <Fremdriftslinje steg={steg} prosent={prosent} />
                </div>
              )}

              {rapport && !erAktiv && <Rapport rapport={rapport} />}

              {!erAktiv && !rapport && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-2xl bg-fjord-50 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-fjord-400" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
                    Velg en tomt å analysere
                  </h2>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Søk etter en adresse i søkefeltet over, eller klikk direkte
                    på kartet for å velge en lokasjon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
