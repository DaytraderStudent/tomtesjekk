"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { MapPin, Search, X, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { lagreRapport } from "@/lib/rapport-storage";
import { PDFEksport } from "@/components/PDFEksport";
import L from "leaflet";
import { Adressesok } from "@/components/Adressesok";
import { Kart } from "@/components/Kart";
import { KartlagPanel } from "@/components/KartlagPanel";
import { Fremdriftslinje } from "@/components/Fremdriftslinje";
import { Rapport } from "@/components/Rapport";
import { STEG_NAVN } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { hentHoyde } from "@/lib/api-helpers";
import { taKartbilderBatch } from "@/lib/kart-capture";
import type { KartlagId } from "@/types";
import {
  flomStatus,
  skredStatus,
  kvikkleireStatus,
  radonStatus,
  grunnStatus,
  nvdbStatus,
  eiendomStatus,
  stoyStatus,
  boligprisStatus,
  reguleringsplanStatus,
  kulturminnerStatus,
  solforholdStatus,
  vaStatus,
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
  EiendomResultat,
  StoyResultat,
  BoligprisResultat,
  ReguleringsplanResultat,
  KulturminneResultat,
  SolforholdResultat,
  VaTilknytningResultat,
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
  const [tomtegrense, setTomtegrense] = useState<GeoJSON.Feature | null>(null);
  const [synligeKartlag, setSynligeKartlag] = useState<Record<KartlagId, boolean>>({
    stoy: false,
    matrikkel: false,
    radon: false,
    losmasser: false,
    regulering: false,
  });
  const kartMapRef = useRef<L.Map | null>(null);
  const kartContainerRef = useRef<HTMLDivElement | null>(null);

  const handleKartlagToggle = useCallback((id: KartlagId) => {
    setSynligeKartlag((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleMapReady = useCallback((map: L.Map, container: HTMLDivElement) => {
    kartMapRef.current = map;
    kartContainerRef.current = container;
  }, []);

  const oppdaterSteg = (id: string, status: AnalyseSteg["status"], feilmelding?: string) => {
    setSteg((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, feilmelding } : s))
    );
  };

  const startAnalyse = useCallback(async (adresse: KartverketAdresse) => {
    setErAktiv(true);
    setRapport(null);
    setPanelApen(true);
    setTomtegrense(null);
    setSteg(lagInitielleSteg());
    setProsent(0);

    const { lat, lon } = adresse.representasjonspunkt;
    const kort: AnalyseKort[] = [];
    let eiendomArealKvm: number | null = null;

    oppdaterSteg("adresse", "aktiv");
    setProsent(3);
    await new Promise((r) => setTimeout(r, 300));
    oppdaterSteg("adresse", "ferdig");
    setProsent(5);

    // Eiendom step: cadastral info + boundary polygon
    let grenseGeoJson: GeoJSON.Feature | null = null;
    oppdaterSteg("eiendom", "aktiv");
    try {
      const eiendomRes = await fetch(`/api/eiendom?lat=${lat}&lon=${lon}`);
      const eiendom: EiendomResultat = await eiendomRes.json();
      if (eiendom.matrikkelnummertekst) {
        eiendomArealKvm = eiendom.arealKvm ?? null;
        const es = eiendomStatus(eiendom);
        kort.push({
          id: "eiendom",
          tittel: "Eiendom",
          beskrivelse: es.tekst,
          detaljer: eiendom.arealKvm
            ? `Matrikkel: ${eiendom.matrikkelnummertekst}. Beregnet tomteareal: ${Math.round(eiendom.arealKvm)} m².`
            : `Matrikkel: ${eiendom.matrikkelnummertekst}. Areal ikke tilgjengelig.`,
          status: es.status,
          statusTekst: es.tekst,
          kilde: "Geonorge Eiendom",
          kildeUrl: "https://ws.geonorge.no/eiendom/v1",
        });
        if (eiendom.grenseGeoJson) {
          grenseGeoJson = eiendom.grenseGeoJson;
          setTomtegrense(eiendom.grenseGeoJson);
        }
        oppdaterSteg("eiendom", "ferdig");
      } else {
        oppdaterSteg("eiendom", "feil", "Ingen eiendom funnet");
      }
    } catch {
      oppdaterSteg("eiendom", "feil", "Kunne ikke hente eiendomsdata");
    }
    setProsent(12);

    // Reguleringsplan step
    oppdaterSteg("regulering", "aktiv");
    try {
      const regRes = await fetch(`/api/reguleringsplan?lat=${lat}&lon=${lon}`);
      const regData = await regRes.json();
      if (regRes.ok && !regData.error) {
        const regPlan: ReguleringsplanResultat = regData;
        const rs = reguleringsplanStatus(regPlan);
        // Build link to municipality plan viewer (arealplaner.no)
        const kommuneSlug = adresse.kommunenavn
          ? `${adresse.kommunenavn.toLowerCase().replace(/\s+/g, "")}${adresse.kommunenummer}`
          : null;
        const planinnsynUrl = kommuneSlug
          ? `https://arealplaner.no/${kommuneSlug}/arealplaner`
          : "https://arealplaner.no";

        let regDetaljer: string;
        let regKilde: string;
        let regKildeUrl: string;
        if (regPlan.harPlan) {
          regDetaljer = regPlan.detaljer || `${regPlan.planType || "Reguleringsplan"}: ${regPlan.planNavn || "Navn ikke tilgjengelig"}${regPlan.arealformaal ? `. Arealformål: ${regPlan.arealformaal}` : ""}`;

          // Append BYA/height info if available
          if (regPlan.utnyttingsgrad || regPlan.maksHoyde || regPlan.maksEtasjer) {
            const kildeTekst = regPlan.utnyttelseKilde === "plan"
              ? "fra plandata"
              : "veiledende TEK17-referanse";
            regDetaljer += `\n\nUtnyttelse (${kildeTekst}):`;
            if (regPlan.utnyttingsgrad) {
              const maksBebygget = eiendomArealKvm
                ? Math.round((regPlan.utnyttingsgrad / 100) * eiendomArealKvm)
                : null;
              regDetaljer += `\n• Maks BYA: ${regPlan.utnyttingsgrad}%`;
              if (maksBebygget) {
                regDetaljer += ` (ca. ${maksBebygget} m² på denne tomten)`;
              }
            }
            if (regPlan.maksHoyde) {
              regDetaljer += `\n• Maks byggehøyde: ${regPlan.maksHoyde} m`;
            }
            if (regPlan.maksEtasjer) {
              regDetaljer += `\n• Maks etasjer: ${regPlan.maksEtasjer}`;
            }
          }

          regKilde = "DiBK / Geonorge";
          regKildeUrl = "https://nap.ft.dibk.no/services/wms/reguleringsplaner/";
        } else if (regPlan.harPlan === null) {
          regDetaljer = `Nasjonal plandata-API (DiBK) er under oppbygging og har ikke fullstendige data ennå. Sjekk kommunens planinnsyn for gjeldende reguleringsplan.`;
          regKilde = `Planinnsyn ${adresse.kommunenavn || ""}`;
          regKildeUrl = planinnsynUrl;
        } else {
          regDetaljer = "Ingen reguleringsplan registrert. Området kan være uregulert — kontakt kommunen for å avklare gjeldende plansituasjon.";
          regKilde = `Planinnsyn ${adresse.kommunenavn || ""}`;
          regKildeUrl = planinnsynUrl;
        }

        // Build raadata with structured BYA values
        const maksBebyggetAreal = regPlan.utnyttingsgrad && eiendomArealKvm
          ? Math.round((regPlan.utnyttingsgrad / 100) * eiendomArealKvm)
          : null;
        const regRaadata = (regPlan.utnyttingsgrad || regPlan.maksHoyde || regPlan.maksEtasjer)
          ? {
              utnyttingsgrad: regPlan.utnyttingsgrad,
              maksHoyde: regPlan.maksHoyde,
              maksEtasjer: regPlan.maksEtasjer,
              utnyttelseKilde: regPlan.utnyttelseKilde,
              arealKvm: eiendomArealKvm,
              maksBebyggetAreal,
            }
          : undefined;

        kort.push({
          id: "regulering",
          tittel: "Reguleringsplan",
          beskrivelse: rs.tekst,
          detaljer: regDetaljer,
          status: rs.status,
          statusTekst: rs.tekst,
          kilde: regKilde,
          kildeUrl: regKildeUrl,
          raadata: regRaadata,
        });
        oppdaterSteg("regulering", "ferdig");
      } else {
        oppdaterSteg("regulering", "feil", "Kunne ikke hente plandata");
      }
    } catch {
      oppdaterSteg("regulering", "feil", "Kunne ikke hente reguleringsplan");
    }
    setProsent(18);

    // Kulturminner step
    oppdaterSteg("kulturminner", "aktiv");
    try {
      const kmRes = await fetch(`/api/kulturminner?lat=${lat}&lon=${lon}`);
      const kmData: KulturminneResultat = await kmRes.json();
      if (kmRes.ok && !("error" in kmData)) {
        const ks = kulturminnerStatus(kmData);

        let kmDetaljer: string;
        if (!kmData.harKulturminner) {
          kmDetaljer = "Ingen registrerte kulturminner innen 200 m fra tomtepunktet.";
        } else {
          const linjer = kmData.minner.map((m) => {
            const vern = m.vernetype ? ` (${m.vernetype})` : "";
            return `• ${m.navn}${vern} — ${m.avstandMeter} m`;
          });
          kmDetaljer = `${kmData.minner.length} kulturminne${kmData.minner.length > 1 ? "r" : ""} funnet innen 200 m:\n${linjer.join("\n")}`;
          if (kmData.harFredning) {
            kmDetaljer += "\n\nOBS: Fredet kulturminne i nærheten — dispensasjon fra Riksantikvaren kan kreves.";
          }
        }

        kort.push({
          id: "kulturminner",
          tittel: "Kulturminner",
          beskrivelse: ks.tekst,
          detaljer: kmDetaljer,
          status: ks.status,
          statusTekst: ks.tekst,
          kilde: "Riksantikvaren",
          kildeUrl: "https://kulturminnesok.no",
          raadata: kmData.harKulturminner
            ? { minner: kmData.minner, harFredning: kmData.harFredning, naermesteAvstandMeter: kmData.naermesteAvstandMeter }
            : undefined,
        });
        oppdaterSteg("kulturminner", "ferdig");
      } else {
        oppdaterSteg("kulturminner", "feil", "Kunne ikke hente kulturminnedata");
      }
    } catch {
      oppdaterSteg("kulturminner", "feil", "Kunne ikke hente kulturminnedata");
    }
    setProsent(22);

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
    setProsent(28);

    oppdaterSteg("radon", "aktiv");
    oppdaterSteg("grunn", "aktiv");
    oppdaterSteg("ssb", "aktiv");
    oppdaterSteg("nvdb", "aktiv");
    oppdaterSteg("stoy", "aktiv");
    oppdaterSteg("boligpris", "aktiv");
    oppdaterSteg("solforhold", "aktiv");
    oppdaterSteg("va", "aktiv");

    const [radonRes, grunnRes, ssbRes, nvdbRes, stoyRes, boligprisRes, solforholdRes, vaRes] = await Promise.allSettled([
      fetch(`/api/ngu-radon?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch(`/api/ngu-grunn?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch("/api/ssb").then((r) => r.json()),
      fetch(`/api/nvdb?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch(`/api/stoy?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch(`/api/boligpris?kommunenummer=${adresse.kommunenummer}`).then((r) => r.json()),
      fetch(`/api/solforhold?lat=${lat}&lon=${lon}`).then((r) => r.json()),
      fetch(`/api/va-tilknytning?lat=${lat}&lon=${lon}`).then((r) => r.json()),
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

    if (ssbRes.status === "fulfilled" && !ssbRes.value.error) {
      const data: SsbResultat = ssbRes.value;
      const trend = data.endringProsent > 2 ? "gul" as const : "gronn" as const;
      const periodeLabel = data.periode.replace(/(\d{4})M(\d{2})/, (_, y: string, m: string) => {
        const mnd = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
        return `${mnd[parseInt(m, 10) - 1]} ${y}`;
      });
      const endringTekst = data.endringProsent > 0
        ? `opp ${data.endringProsent}% siste måned`
        : data.endringProsent < 0
          ? `ned ${Math.abs(data.endringProsent)}% siste måned`
          : "uendret siste måned";
      // SSB index base: ~30 000 kr/m² in 2015 (index=100) for average Norwegian house
      const krPerKvm = Math.round((data.indeksverdi / 100) * 30000);
      const krFormatert = krPerKvm.toLocaleString("nb-NO");
      kort.push({
        id: "ssb", tittel: "Byggekostnader",
        beskrivelse: trend === "gul"
          ? `ca. ${krFormatert} kr/m² — ${endringTekst}`
          : `ca. ${krFormatert} kr/m² — ${endringTekst}`,
        detaljer: `Estimert byggekostnad: ca. ${krFormatert} kr/m² (basert på SSBs byggekostnadsindeks ${data.indeksverdi} per ${periodeLabel}). Indeksen måler prisutviklingen på materialer og arbeid for boligbygging i Norge. En endring på ${data.endringProsent > 0 ? "+" : ""}${data.endringProsent}% tyder på ${data.endringProsent > 2 ? "økende kostnadspress — vurder å innhente tilbud raskt" : "et stabilt kostnadsnivå for byggeprosjekter"}. Merk: Faktisk kostnad varierer med tomteforhold, størrelse og standard.`,
        status: trend,
        statusTekst: trend === "gul"
          ? `Stigende kostnader (+${data.endringProsent}%)`
          : `Stabile kostnader (${endringTekst})`,
        kilde: "SSB", kildeUrl: "https://ssb.no",
      });
      oppdaterSteg("ssb", "ferdig");
    } else {
      oppdaterSteg("ssb", "feil", "Kunne ikke hente SSB-data");
    }

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

    if (stoyRes.status === "fulfilled" && !stoyRes.value.error) {
      const data: StoyResultat = stoyRes.value;
      const ss = stoyStatus(data);
      kort.push({
        id: "stoy", tittel: "Støy", beskrivelse: ss.tekst,
        detaljer: data.detaljer || "", status: ss.status,
        statusTekst: ss.tekst, kilde: "Statens vegvesen (Støy)",
        kildeUrl: "https://www.vegvesen.no/kart/ogc/norstoy_1_0/ows",
      });
      oppdaterSteg("stoy", "ferdig");
    } else {
      oppdaterSteg("stoy", "feil", "Kunne ikke hente støydata");
    }

    if (boligprisRes.status === "fulfilled" && !boligprisRes.value.error) {
      const data: BoligprisResultat = boligprisRes.value;
      if (data.kommunenavn === "" && adresse.kommunenavn) {
        data.kommunenavn = adresse.kommunenavn;
      }
      const bs = boligprisStatus(data);
      kort.push({
        id: "boligpris", tittel: "Boligpriser", beskrivelse: bs.tekst,
        detaljer: data.detaljer || "", status: bs.status,
        statusTekst: bs.tekst, kilde: "SSB",
        kildeUrl: "https://ssb.no",
      });
      oppdaterSteg("boligpris", "ferdig");
    } else {
      oppdaterSteg("boligpris", "feil", "Kunne ikke hente boligprisdata");
    }

    if (solforholdRes.status === "fulfilled" && !solforholdRes.value.error) {
      const data: SolforholdResultat = solforholdRes.value;
      const ss = solforholdStatus(data);
      const sommerRetning = data.sommer.soloppgangRetning !== "—"
        ? ` (${data.sommer.soloppgangRetning} → ${data.sommer.solnedgangRetning})`
        : "";
      const vinterRetning = data.vinter.soloppgangRetning !== "—"
        ? ` (${data.vinter.soloppgangRetning} → ${data.vinter.solnedgangRetning})`
        : "";
      const detaljerTekst =
        `Sommer (21. juni): Soloppgang ${data.sommer.soloppgang}, solnedgang ${data.sommer.solnedgang}${sommerRetning}, ` +
        `daglengde ${data.sommer.daglengdeTimer} t, solhøyde kl 12: ${data.sommer.solhoyde12}°\n` +
        `Vinter (21. des): Soloppgang ${data.vinter.soloppgang}, solnedgang ${data.vinter.solnedgang}${vinterRetning}, ` +
        `daglengde ${data.vinter.daglengdeTimer} t, solhøyde kl 12: ${data.vinter.solhoyde12}°\n` +
        `Hovedsolretning: ${data.hovedretning}`;
      kort.push({
        id: "solforhold",
        tittel: "Solforhold",
        beskrivelse: ss.tekst,
        detaljer: detaljerTekst,
        status: ss.status,
        statusTekst: ss.tekst,
        kilde: "SunCalc",
        kildeUrl: "https://github.com/mourner/suncalc",
        raadata: { sommer: data.sommer, vinter: data.vinter, hovedretning: data.hovedretning },
      });
      oppdaterSteg("solforhold", "ferdig");
    } else {
      oppdaterSteg("solforhold", "feil", "Kunne ikke beregne solforhold");
    }

    if (vaRes.status === "fulfilled" && !vaRes.value.error) {
      const data: VaTilknytningResultat = vaRes.value;
      const vs = vaStatus(data);
      kort.push({
        id: "va",
        tittel: "VA-tilknytning",
        beskrivelse: vs.tekst,
        detaljer: `${data.forklaring}\n\nKostnadsindikasjon: ${data.kostnadIndikasjon}\n\nMerk: Dette er en heuristisk indikator basert på avstand til nabobebyggelse og offentlig vei. Det erstatter ikke et faktisk ledningskart fra kommunen.`,
        status: vs.status,
        statusTekst: vs.tekst,
        kilde: data.kilder.join(" + "),
        kildeUrl: "https://www.geonorge.no",
        raadata: { estimertAvstand: data.estimertAvstand, statusKode: data.status },
      });
      oppdaterSteg("va", "ferdig");
    } else {
      oppdaterSteg("va", "feil", "Kunne ikke estimere VA-tilknytning");
    }

    setProsent(75);

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
            // Include structured data (e.g. BYA values) so Claude can reason about buildable area
            raadata: k.raadata,
          })),
        }),
      });
      const aiData = await aiRes.json();
      if (aiData.tekst) {
        aiOppsummering = {
          tekst: aiData.tekst,
          generert: aiData.generert,
          strukturert: aiData.strukturert,
        };
        oppdaterSteg("ai", "ferdig");
      } else {
        oppdaterSteg("ai", "feil", "AI-oppsummering utilgjengelig");
      }
    } catch {
      oppdaterSteg("ai", "feil", "Kunne ikke generere AI-oppsummering");
    }
    setProsent(90);

    // Fetch elevation data
    const hoyde = await hentHoyde(lat, lon);

    // Capture map images — wait for map to settle after fitBounds
    let kartBilde: string | null = null;
    let kartBilder: Record<string, string> = {};
    if (kartMapRef.current && kartContainerRef.current) {
      await new Promise((r) => setTimeout(r, 1500));
      const aktivKategorier = kort.map((k) => k.id);
      kartBilder = await taKartbilderBatch(
        kartMapRef.current,
        kartContainerRef.current,
        grenseGeoJson,
        aktivKategorier
      );
      kartBilde = kartBilder["base"] || null;
    }

    // Enable stoy layer on map after analysis
    setSynligeKartlag((prev) => ({ ...prev, stoy: true }));

    setProsent(100);

    const nyttRapport: RapportType = {
      adresse, kort, aiOppsummering, hoydeOverHavet: hoyde, kartBilde, kartBilder,
      tidspunkt: new Date().toISOString(),
    };
    setRapport(nyttRapport);
    lagreRapport(nyttRapport);

    setErAktiv(false);
    toast.success("Analyse ferdig!");
  }, []);

  const handleVelgAdresse = (adresse: KartverketAdresse) => {
    setValgtAdresse(adresse);
  };

  // Auto-start analysis if lat/lon provided in URL (from Tomtefinner deep link)
  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const latParam = params.get("lat");
    const lonParam = params.get("lon");
    if (!latParam || !lonParam) return;
    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);
    if (isNaN(lat) || isNaN(lon)) return;

    hasAutoStartedRef.current = true;

    // Reverse geocode to get proper address
    (async () => {
      const fallback: KartverketAdresse = {
        adressetekst: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        poststed: "", postnummer: "", kommunenavn: "", kommunenummer: "",
        representasjonspunkt: { lat, lon },
      };
      let adresse = fallback;
      try {
        const res = await fetch(
          `https://ws.geonorge.no/adresser/v1/punktsok?lat=${lat}&lon=${lon}&radius=500&treffPerSide=1`
        );
        const data = await res.json();
        if (data.adresser?.[0]) {
          const a = data.adresser[0];
          adresse = {
            adressetekst: a.adressetekst || fallback.adressetekst,
            poststed: a.poststed || "",
            postnummer: a.postnummer || "",
            kommunenavn: a.kommunenavn || "",
            kommunenummer: a.kommunenummer || "",
            representasjonspunkt: { lat, lon },
          };
        }
      } catch {}
      setValgtAdresse(adresse);
      // Wait for map to be ready before starting
      setTimeout(() => startAnalyse(adresse), 500);
    })();
  }, []);

  const handleKlikkKart = async (lat: number, lon: number) => {
    const fallback: KartverketAdresse = {
      adressetekst: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      poststed: "", postnummer: "", kommunenavn: "", kommunenummer: "",
      representasjonspunkt: { lat, lon },
    };
    try {
      const res = await fetch(
        `https://ws.geonorge.no/adresser/v1/punktsok?lat=${lat}&lon=${lon}&radius=200&treffPerSide=1`
      );
      const data = await res.json();
      if (data.adresser && data.adresser.length > 0) {
        const a = data.adresser[0];
        setValgtAdresse({
          adressetekst: a.adressetekst || fallback.adressetekst,
          poststed: a.poststed || "",
          postnummer: a.postnummer || "",
          kommunenavn: a.kommunenavn || "",
          kommunenummer: a.kommunenummer || "",
          representasjonspunkt: { lat, lon },
        });
      } else {
        setValgtAdresse(fallback);
      }
    } catch {
      setValgtAdresse(fallback);
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
          grense={tomtegrense}
          synligeKartlag={synligeKartlag}
          onKlikkKart={handleKlikkKart}
          onMapReady={handleMapReady}
        />
      </div>

      {/* Left sidebar: kartlag toggles (only after analysis) */}
      {rapport && (
        <KartlagPanel synlige={synligeKartlag} onToggle={handleKartlagToggle} />
      )}

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
              <Adressesok
                onVelgAdresse={handleVelgAdresse}
                onSubmit={() => valgtAdresse && startAnalyse(valgtAdresse)}
                eksternAdresseTekst={valgtAdresse?.adressetekst}
                disabled={erAktiv}
              />
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
                {rapport && !erAktiv && (
                  <>
                    <Rapport rapport={rapport} />
                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/analyser/detaljer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-fjord-500 text-white rounded-xl font-semibold hover:bg-fjord-600 transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Full rapport
                      </Link>
                      <PDFEksport rapport={rapport} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
