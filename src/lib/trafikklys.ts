import type { TrafikklysStatus, NveResultat, NguRadonResultat, NguGrunnResultat, NvdbResultat } from "@/types";

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

export function nvdbStatus(data: NvdbResultat): { status: TrafikklysStatus; tekst: string } {
  if (data.avstand <= 50) return { status: "gronn", tekst: `${Math.round(data.avstand)}m til nærmeste vei` };
  if (data.avstand <= 150) return { status: "gul", tekst: `${Math.round(data.avstand)}m til nærmeste vei` };
  return { status: "rod", tekst: `${Math.round(data.avstand)}m til nærmeste vei (lang avstand)` };
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
