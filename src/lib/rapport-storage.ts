import type { Rapport } from "@/types";

const STORAGE_KEY = "tomtesjekk-rapport";

export function lagreRapport(rapport: Rapport): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rapport));
  } catch {
    // sessionStorage may be unavailable in private browsing
  }
}

export function hentRapport(): Rapport | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Rapport;
  } catch {
    return null;
  }
}
