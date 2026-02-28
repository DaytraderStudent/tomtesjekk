export const API_TIMEOUT = 10000;

export const API_URLS = {
  kartverket: "https://ws.geonorge.no/adresser/v1/sok",
  eiendomPunkt: "https://ws.geonorge.no/eiendom/v1/punkt",
  eiendomOmrader: "https://ws.geonorge.no/eiendom/v1/punkt/omrader",
  nveFlom: "https://gis3.nve.no/arcgis/rest/services/FlomAktsomhet/MapServer/identify",
  nveSkred: "https://gis3.nve.no/arcgis/rest/services/SkredAktsomhet/MapServer/identify",
  nveKvikkleire: "https://gis3.nve.no/arcgis/rest/services/Kvikkleire4/MapServer/identify",
  nguRadon: "https://geo.ngu.no/mapserver/RadonWMS2",
  nguLosmasser: "https://geo.ngu.no/mapserver/LosmasserWMS3",
  ssb: "https://data.ssb.no/api/v0/no/table/08651",
  nvdb: "https://nvdbapiles-v3.atlas.vegvesen.no/posisjon",
  stoyVegvesen: "https://www.vegvesen.no/kart/ogc/norstoy_1_0/ows",
  boligpris: "https://data.ssb.no/api/v0/no/table/06035",
} as const;

export const STEG_NAVN: Record<string, string> = {
  adresse: "Slår opp adresse",
  eiendom: "Henter tomtegrenser og matrikkelinfo",
  nve: "Sjekker flom, skred og kvikkleire (NVE)",
  radon: "Sjekker radonnivå (NGU)",
  grunn: "Sjekker grunnforhold (NGU)",
  ssb: "Henter byggekostnadsindeks (SSB)",
  nvdb: "Sjekker veitilgang (NVDB)",
  stoy: "Sjekker støynivå (Statens vegvesen)",
  boligpris: "Henter boligpriser (SSB)",
  ai: "Genererer AI-oppsummering",
};

export const DISCLAIMER_TEXT =
  "Tomtesjekk er et gratis verktøy som sammenstiller offentlig tilgjengelig data. " +
  "Resultatene er veiledende og erstatter ikke profesjonelle undersøkelser. " +
  "Rådfør deg alltid med fagpersoner før viktige beslutninger om eiendomskjøp eller bygging.";

export const DATAKILDER = [
  { navn: "Kartverket", url: "https://kartverket.no" },
  { navn: "Geonorge Eiendom", url: "https://ws.geonorge.no/eiendom/v1" },
  { navn: "NVE", url: "https://nve.no" },
  { navn: "NGU", url: "https://ngu.no" },
  { navn: "SSB", url: "https://ssb.no" },
  { navn: "Statens vegvesen (NVDB)", url: "https://nvdbapiles-v3.atlas.vegvesen.no" },
  { navn: "Statens vegvesen (Støy)", url: "https://www.vegvesen.no/kart/ogc/norstoy_1_0/ows" },
];
