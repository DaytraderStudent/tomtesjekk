import type { TrafikklysStatus, NveResultat, NguRadonResultat, NguGrunnResultat, NvdbResultat, EiendomResultat, StoyResultat, BoligprisResultat, ReguleringsplanResultat, KulturminneResultat, SolforholdResultat, VaTilknytningResultat } from "@/types";

export function flomStatus(data: NveResultat["flom"]): { status: TrafikklysStatus; tekst: string } {
  if (!data.aktsomhetsomrade) return { status: "gronn", tekst: "Ikke i flomaktsomhetsområde" };
  if (data.faregrad === "høy" || data.faregrad === "svært høy") return { status: "rod", tekst: `Flomfare: ${data.faregrad}` };
  return { status: "gul", tekst: `I flomaktsomhetsområde${data.faregrad ? ` (${data.faregrad})` : ""}` };
}

export function skredStatus(data: NveResultat["skred"]): { status: TrafikklysStatus; tekst: string } {
  if (!data.aktsomhetsomrade) return { status: "gronn", tekst: "Ikke i skredaktsomhetsområde" };
  if (data.skredtype) return { status: "rod", tekst: `Skredfare: ${data.skredtype}` };
  return { status: "gul", tekst: "I skredaktsomhetsområde" };
}

export function kvikkleireStatus(data: NveResultat["kvikkleire"]): { status: TrafikklysStatus; tekst: string } {
  if (!data.faresone) return { status: "gronn", tekst: "Ingen kjent kvikkleiresone" };
  if (data.faregrad === "høy") return { status: "rod", tekst: "Høy kvikkleirefare" };
  return { status: "gul", tekst: `Kvikkleiresone${data.faregrad ? ` (${data.faregrad})` : ""}` };
}

export function radonStatus(data: NguRadonResultat): { status: TrafikklysStatus; tekst: string } {
  switch (data.nivaa) {
    case "lav": return { status: "gronn", tekst: "Lav radonrisiko" };
    case "moderat": return { status: "gul", tekst: "Moderat radonrisiko" };
    case "hoy": return { status: "rod", tekst: "Høy radonrisiko" };
    default: return { status: "gra", tekst: "Radondata ikke tilgjengelig" };
  }
}

export function grunnStatus(data: NguGrunnResultat): { status: TrafikklysStatus; tekst: string } {
  const jordart = data.jordart.toLowerCase();
  if (jordart.includes("fjell") || jordart.includes("morene")) {
    return { status: "gronn", tekst: `Gunstig grunn: ${data.jordart}` };
  }
  if (jordart.includes("leire") || jordart.includes("torv") || jordart.includes("myr")) {
    return { status: "gul", tekst: `Krevende grunn: ${data.jordart}` };
  }
  if (jordart.includes("kvikkleire")) {
    return { status: "rod", tekst: `Problematisk grunn: ${data.jordart}` };
  }
  return { status: "gronn", tekst: data.jordart };
}

export function eiendomStatus(data: EiendomResultat): { status: TrafikklysStatus; tekst: string } {
  if (!data.matrikkelnummertekst) return { status: "gra", tekst: "Eiendomsdata ikke tilgjengelig" };
  const arealTekst = data.arealKvm ? `${Math.round(data.arealKvm)} m²` : "ukjent areal";
  return { status: "gronn", tekst: `${data.matrikkelnummertekst} — ${arealTekst}` };
}

export function nvdbStatus(data: NvdbResultat): { status: TrafikklysStatus; tekst: string } {
  if (data.avstand <= 50) return { status: "gronn", tekst: `${Math.round(data.avstand)}m til nærmeste vei` };
  if (data.avstand <= 150) return { status: "gul", tekst: `${Math.round(data.avstand)}m til nærmeste vei` };
  return { status: "rod", tekst: `${Math.round(data.avstand)}m til nærmeste vei (lang avstand)` };
}

export function stoyStatus(data: StoyResultat): { status: TrafikklysStatus; tekst: string } {
  if (!data.harStoy || data.nivaDb === null) return { status: "gronn", tekst: "Under 55 dB — stille område" };
  if (data.nivaDb <= 55) return { status: "gronn", tekst: "55 dB — lite støy" };
  if (data.nivaDb <= 65) return { status: "gul", tekst: `${data.nivaDb} dB — merkbar veitrafikkstøy` };
  return { status: "rod", tekst: `${data.nivaDb} dB — høy veitrafikkstøy` };
}

export function boligprisStatus(data: BoligprisResultat): { status: TrafikklysStatus; tekst: string } {
  const priser: { type: string; pris: number }[] = [];
  if (data.enebolig !== null) priser.push({ type: "eneboliger", pris: data.enebolig });
  if (data.smahus !== null) priser.push({ type: "småhus", pris: data.smahus });
  if (data.blokk !== null) priser.push({ type: "blokk", pris: data.blokk });

  if (priser.length === 0) return { status: "gra", tekst: "Prisdata ikke tilgjengelig" };

  const hoyest = priser.reduce((a, b) => (b.pris > a.pris ? b : a));
  const formatert = Math.round(hoyest.pris).toLocaleString("nb-NO");
  return { status: "gronn", tekst: `ca. ${formatert} kr/m² for ${hoyest.type} (${data.aar})` };
}

export function kulturminnerStatus(data: KulturminneResultat): { status: TrafikklysStatus; tekst: string } {
  if (!data.harKulturminner) {
    return { status: "gronn", tekst: "Ingen kulturminner innen 200 m" };
  }

  const naermeste = data.naermesteAvstandMeter ?? 200;
  const fredeteNaer = data.minner.filter(
    (m) => erFredetVernetype(m.vernetype)
  );
  const naermestFredet = fredeteNaer.length > 0
    ? Math.min(...fredeteNaer.map((m) => m.avstandMeter))
    : Infinity;

  // Rod: fredet innen 10m
  if (naermestFredet <= 10) {
    return { status: "rod", tekst: `Fredet kulturminne ${Math.round(naermestFredet)} m unna` };
  }

  // Gul: kulturminne innen 50m, ELLER fredning innen 200m
  if (naermeste <= 50 || naermestFredet <= 200) {
    const grunn = naermestFredet <= 200
      ? `Fredning ${Math.round(naermestFredet)} m unna`
      : `Kulturminne ${Math.round(naermeste)} m unna`;
    return { status: "gul", tekst: grunn };
  }

  // Gronn: kun i 50-200m sonen uten fredning nær
  return { status: "gronn", tekst: `Nærmeste kulturminne ${Math.round(naermeste)} m unna` };
}

function erFredetVernetype(vernetype: string): boolean {
  const v = vernetype.toLowerCase();
  return v.includes("fredet") || v.includes("fredning");
}

export function reguleringsplanStatus(data: ReguleringsplanResultat): { status: TrafikklysStatus; tekst: string } {
  if (data.harPlan === null) {
    return { status: "gra", tekst: "Planstatus kunne ikke sjekkes — kontakt kommunen" };
  }
  if (!data.harPlan) {
    return { status: "rod", tekst: "Ingen reguleringsplan funnet — uregulert område" };
  }
  const formaal = (data.arealformaal || "").toLowerCase();
  if (formaal.includes("bolig")) {
    return { status: "gronn", tekst: `Regulert til ${data.arealformaal}` };
  }
  if (formaal.includes("sentrum") || formaal.includes("blandet")) {
    return { status: "gronn", tekst: `Regulert til ${data.arealformaal}` };
  }
  if (data.arealformaal) {
    return { status: "gul", tekst: `Regulert til ${data.arealformaal}` };
  }
  return { status: "gronn", tekst: `Reguleringsplan: ${data.planNavn || "Ja"}` };
}

export function vaStatus(data: VaTilknytningResultat): { status: TrafikklysStatus; tekst: string } {
  const avstand = data.estimertAvstand;
  const avstandTekst = avstand != null ? ` (~${avstand} m til infrastruktur)` : "";
  switch (data.status) {
    case "gronn":
      return { status: "gronn", tekst: `Sannsynlig kommunalt VA${avstandTekst}` };
    case "gul":
      return { status: "gul", tekst: `VA mulig men usikker${avstandTekst}` };
    case "rod":
      return { status: "rod", tekst: "Sannsynlig privat løsning nødvendig" };
    default:
      return { status: "gra", tekst: "VA-status kunne ikke estimeres" };
  }
}

export function solforholdStatus(data: SolforholdResultat): { status: TrafikklysStatus; tekst: string } {
  const vinterDaglengde = data.vinter.daglengdeTimer;
  const vinterSolhoyde12 = data.vinter.solhoyde12;

  if (vinterDaglengde >= 6 && vinterSolhoyde12 >= 8) {
    return { status: "gronn", tekst: "Gode solforhold" };
  }
  if (vinterDaglengde >= 4 && vinterSolhoyde12 >= 3) {
    return { status: "gul", tekst: "Moderate solforhold" };
  }
  return { status: "rod", tekst: "Begrensede solforhold" };
}

export function statusFarge(status: TrafikklysStatus): string {
  switch (status) {
    case "gronn": return "#2ECC71";
    case "gul": return "#F39C12";
    case "rod": return "#E74C3C";
    case "gra": return "#9CA3AF";
  }
}

export function statusLabel(status: TrafikklysStatus): string {
  switch (status) {
    case "gronn": return "Lav risiko";
    case "gul": return "Moderat risiko";
    case "rod": return "Høy risiko";
    case "gra": return "Ukjent";
  }
}
