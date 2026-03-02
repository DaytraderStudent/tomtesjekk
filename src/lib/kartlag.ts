import type { KartlagId } from "@/types";

export interface KartlagConfig {
  id: KartlagId;
  navn: string;
  baseUrl: string;
  layers: string;
  opacity: number;
  minZoom: number;
  farge: string;
}

export const KARTLAG: KartlagConfig[] = [
  {
    id: "stoy",
    navn: "Stoyvarselkart",
    baseUrl: "https://www.vegvesen.no/kart/ogc/norstoy_1_0/ows",
    layers: "Stoyvarselkart",
    opacity: 0.4,
    minZoom: 13,
    farge: "#EF4444",
  },
  {
    id: "matrikkel",
    navn: "Eiendomsgrenser",
    baseUrl: "https://wms.geonorge.no/skwms1/wms.matrikkelkart",
    layers: "eiendomsgrense",
    opacity: 0.6,
    minZoom: 15,
    farge: "#3B82F6",
  },
  {
    id: "radon",
    navn: "Radonaktsomhet",
    baseUrl: "https://geo.ngu.no/mapserver/RadonWMS",
    layers: "Radonaktsomhet",
    opacity: 0.4,
    minZoom: 10,
    farge: "#A855F7",
  },
  {
    id: "losmasser",
    navn: "Losmasser",
    baseUrl: "https://geo.ngu.no/mapserver/LosmasserWMS",
    layers: "Losmasse_flate",
    opacity: 0.4,
    minZoom: 10,
    farge: "#F59E0B",
  },
  {
    id: "regulering",
    navn: "Reguleringsplaner",
    baseUrl: "https://nap.ft.dibk.no/services/wms/reguleringsplaner/",
    layers: "reguleringsplanomrade",
    opacity: 0.35,
    minZoom: 12,
    farge: "#10B981",
  },
];

export const KARTLAG_MAP: Record<KartlagId, KartlagConfig> = Object.fromEntries(
  KARTLAG.map((k) => [k.id, k])
) as Record<KartlagId, KartlagConfig>;

/** Maps analysis category IDs to relevant kartlag IDs */
export const KATEGORI_KARTLAG: Record<string, KartlagId[]> = {
  stoy: ["stoy"],
  radon: ["radon"],
  grunn: ["losmasser"],
  regulering: ["regulering"],
  eiendom: ["matrikkel"],
};
