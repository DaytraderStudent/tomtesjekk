export const API_TIMEOUT = 10000;

export const API_URLS = {
  kartverket: "https://ws.geonorge.no/adresser/v1/sok",
  nveFlom: "https://gis3.nve.no/arcgis/rest/services/FlomAktsomhet/MapServer/identify",
  nveSkred: "https://gis3.nve.no/arcgis/rest/services/SkredAktsomhet/MapServer/identify",
  nveKvikkleire: "https://gis3.nve.no/arcgis/rest/services/Kvikkleire4/MapServer/identify",
  nguRadon: "https://geo.ngu.no/mapserver/RadonWMS2",
  nguLosmasser: "https://geo.ngu.no/mapserver/LosmasserWMS3",
  ssb: "https://data.ssb.no/api/v0/no/table/08651",
  nvdb: "https://nvdbapiles-v3.atlas.vegvesen.no/posisjon",
} as const;

export const STEG_NAVN: Record<string, string> = {
  adresse: "Slår opp adresse",
  nve: "Sjekker flom, skred og kvikkleire (NVE)",
  radon: "Sjekker radonnivå (NGU)",
  grunn: "Sjekker grunnforhold (NGU)",
  ssb: "Henter byggekostnadsindeks (SSB)",
  nvdb: "Sjekker veitilgang (NVDB)",
  ai: "Genererer AI-oppsummering",
};

export const DISCLAIMER_TEXT =
  "Tomtesjekk er et gratis verktøy som sammenstiller offentlig tilgjengelig data. " +
  "Resultatene er veiledende og erstatter ikke profesjonelle undersøkelser. " +
  "Rådfør deg alltid med fagpersoner før viktige beslutninger om eiendomskjøp eller bygging.";

export const DATAKILDER = [
  { navn: "Kartverket", url: "https://kartverket.no" },
  { navn: "NVE", url: "https://nve.no" },
  { navn: "NGU", url: "https://ngu.no" },
  { navn: "SSB", url: "https://ssb.no" },
  { navn: "Statens vegvesen (NVDB)", url: "https://nvdbapiles-v3.atlas.vegvesen.no" },
];
