"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Info, Building2, Ruler, Layers, BadgePercent, MapPin, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusFarge, statusLabel } from "@/lib/trafikklys";
import { hentKortIkon } from "@/lib/kort-ikoner";
import type { AnalyseKort, SolbanePunkt } from "@/types";

function SolbaneGraf({ sommerBane, vinterBane }: { sommerBane: SolbanePunkt[]; vinterBane: SolbanePunkt[] }) {
  const W = 400;
  const H = 180;
  const padL = 32;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Find max altitude for y-scale (at least 10°)
  const allAlts = [...sommerBane, ...vinterBane].map((p) => p.altitude);
  const maxAlt = Math.max(10, Math.ceil(Math.max(...allAlts) / 10) * 10);
  const minAlt = Math.min(0, Math.floor(Math.min(...allAlts) / 10) * 10);
  const altRange = maxAlt - minAlt;

  const x = (time: number) => padL + (time / 23) * chartW;
  const y = (alt: number) => padT + chartH - ((alt - minAlt) / altRange) * chartH;

  const toPath = (bane: SolbanePunkt[]) =>
    bane.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.time).toFixed(1)},${y(p.altitude).toFixed(1)}`).join(" ");

  const sommerPath = toPath(sommerBane);
  const vinterPath = toPath(vinterBane);

  // Fill area above horizon for summer
  const sommerFill = sommerPath +
    ` L${x(23).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  const horizonY = y(0);
  const timeLabels = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Solbane (høyde over horisonten)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="Solbanediagram">
        {/* Grid lines */}
        {[0, 10, 20, 30, 40, 50, 60].filter((v) => v >= minAlt && v <= maxAlt).map((alt) => (
          <g key={alt}>
            <line
              x1={padL} y1={y(alt)} x2={W - padR} y2={y(alt)}
              stroke={alt === 0 ? "#9CA3AF" : "#E5E7EB"}
              strokeWidth={alt === 0 ? 1 : 0.5}
              strokeDasharray={alt === 0 ? undefined : "4 2"}
            />
            <text x={padL - 4} y={y(alt) + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">
              {alt}°
            </text>
          </g>
        ))}

        {/* Time labels */}
        {timeLabels.map((t) => (
          <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">
            {String(t).padStart(2, "0")}
          </text>
        ))}

        {/* Summer fill (above horizon only) */}
        <clipPath id="above-horizon">
          <rect x={padL} y={padT} width={chartW} height={horizonY - padT} />
        </clipPath>
        <path d={sommerFill} fill="#FCD34D" fillOpacity={0.15} clipPath="url(#above-horizon)" />

        {/* Summer curve */}
        <path d={sommerPath} fill="none" stroke="#D97706" strokeWidth={2} strokeLinejoin="round" />

        {/* Winter curve */}
        <path d={vinterPath} fill="none" stroke="#3B82F6" strokeWidth={2} strokeLinejoin="round" strokeDasharray="6 3" />

        {/* Legend */}
        <line x1={W - padR - 100} y1={padT + 2} x2={W - padR - 82} y2={padT + 2} stroke="#D97706" strokeWidth={2} />
        <text x={W - padR - 78} y={padT + 5} fontSize="9" fill="#92400E">Sommer</text>
        <line x1={W - padR - 100} y1={padT + 14} x2={W - padR - 82} y2={padT + 14} stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 3" />
        <text x={W - padR - 78} y={padT + 17} fontSize="9" fill="#1E40AF">Vinter</text>
      </svg>
    </div>
  );
}

const FORKLARINGER: Record<string, string> = {
  flom:
    "Flomfare viser om eiendommen ligger i et aktsomhetsområde for flom basert på NVEs kartdata. " +
    "Høy risiko betyr at området kan bli oversvømt ved store nedbørsmengder eller snøsmelting. " +
    "Sjekk om kommunen har gjennomført flomsikringstiltak i området.",
  skred:
    "Skredfare dekker snøskred, jordskred og steinsprang. NVE kartlegger aktsomhetsområder " +
    "basert på terrenghelning, løsmasser og historiske hendelser. Byggetiltak i skredutsatte " +
    "områder kan kreve ekstra geotekniske undersøkelser og sikringstiltak.",
  kvikkleire:
    "Kvikkleire er leire som kan bli flytende ved forstyrrelse. NVE kartlegger faresoner " +
    "basert på grunnboringer og terrenganalyser. Bygging i kvikkleireområder krever " +
    "geoteknisk vurdering og kan medføre ekstra fundamenteringskostnader.",
  radon:
    "Radon er en radioaktiv gass fra berggrunnen som kan samle seg i bygninger. " +
    "NGU klassifiserer radonrisiko basert på berggrunnstype. Ved moderat eller høy risiko " +
    "bør radonsperre eller ventilasjon inkluderes i byggeplanene. Målinger anbefales.",
  grunn:
    "Grunnforhold beskriver jordarten på tomten. Fjell og morene gir stabil byggegrunn, " +
    "mens leire, torv og myr kan kreve ekstra fundamentering (peling, masseutskifting). " +
    "Grunnforhold påvirker byggekostnader og mulighet for kjeller.",
  eiendom:
    "Eiendomsinformasjon viser matrikkeldata (gårds- og bruksnummer) og tomteareal " +
    "fra Kartverkets eiendomsregister. Arealet er beregnet fra digitale grensepunkt " +
    "og kan avvike noe fra tinglyste mål.",
  regulering:
    "Reguleringsplanen viser hva tomten er regulert til (bolig, næring, friområde etc.) og " +
    "eventuell tillatt utnyttelsesgrad (BYA%), byggehøyde og antall etasjer. " +
    "Verdier merket «fra plandata» er hentet fra DiBK. Verdier merket «veiledende» er " +
    "TEK17-referanseverdier basert på arealformål — de faktiske bestemmelsene kan avvike. " +
    "Sjekk alltid kommunens planinnsyn for bindende reguleringsbestemmelser.",
  ssb:
    "Byggekostnadsindeksen fra SSB måler prisutviklingen på materialer og arbeid for boligbygging. " +
    "En stigende indeks betyr høyere byggepriser. Den estimerte kr/m²-prisen er et landsgjennomsnitt " +
    "og vil variere med standard, tomteforhold og region.",
  nvdb:
    "Veitilgang viser avstand til nærmeste offentlige vei fra NVDB (Nasjonal vegdatabank). " +
    "Kort avstand gir enklere adkomst for bygging og beboelse. Lang avstand kan bety " +
    "behov for privat vei, som øker kostnadene.",
  stoy:
    "Støynivået er hentet fra Statens vegvesens støykartlegging og viser veitrafikkstøy i desibel. " +
    "Under 55 dB regnes som stille. Over 65 dB anbefales støyisolering. " +
    "Støykrav stilles ved søknad om bygging nær trafikkerte veier.",
  boligpris:
    "Boligpriser fra SSB viser gjennomsnittlig kvadratmeterpris for ulike boligtyper i kommunen. " +
    "Prisene gir en indikasjon på boligmarkedets verdi i området, men varierer " +
    "betydelig med beliggenhet, standard og tomteforhold innad i kommunen.",
  kulturminner:
    "Kulturminner er bygninger, anlegg og områder registrert i Riksantikvarens Askeladden-database. " +
    "Fredede kulturminner har strengt juridisk vern — tiltak som berører et fredet kulturminne krever " +
    "dispensasjon fra Riksantikvaren. Kulturminner i nærheten kan påvirke byggesaken gjennom " +
    "hensynssoner i reguleringsplanen.",
  solforhold:
    "Solforhold beregnes astronomisk ut fra koordinater og viser teoretisk daglengde og solhøyde " +
    "gjennom året. Beregningen tar ikke hensyn til terreng, bygninger eller vegetasjon som kan skygge. " +
    "For nøyaktig solanalyse bør det gjøres en skyggestudie med 3D-terrengmodell.",
};

interface Props {
  kort: AnalyseKort;
  kartBilde?: string | null;
}

export function DetaljerKategori({ kort, kartBilde }: Props) {
  const { icon: Icon, farge: ikonFarge } = hentKortIkon(kort.id);
  const farge = statusFarge(kort.status);
  const label = statusLabel(kort.status);
  const forklaring = FORKLARINGER[kort.id];
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={`kategori-${kort.id}`}
      className={cn(
        "detaljer-kategori scroll-mt-32 lg:scroll-mt-24 bg-paper-soft border border-paper-edge border-l-[3px] overflow-hidden print:break-inside-avoid",
        "kategori-entrance",
        isVisible && "kategori-visible"
      )}
      style={{ borderLeftColor: farge }}
    >
      <div className="p-6 sm:p-8 lg:p-10 space-y-6">
        {/* Editorial header */}
        <header className="flex items-start justify-between gap-4 pb-5 border-b border-paper-edge">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: farge }}
              />
              <span className="label-editorial">{label}</span>
            </div>
            <h3 className="font-display text-2xl lg:text-3xl text-ink tracking-tight leading-tight">
              {kort.tittel}
            </h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              {kort.beskrivelse}
            </p>
          </div>
          <div className="shrink-0">
            <Icon className="w-8 h-8 text-ink-faint" strokeWidth={1.25} />
          </div>
        </header>

        {/* Category map image */}
        {kartBilde && (
          <div className="border border-paper-edge overflow-hidden">
            <img
              src={kartBilde}
              alt={`Kart for ${kort.tittel}`}
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        )}

        {/* Details */}
        {kort.detaljer && (
          <p className="text-[15px] text-ink-soft leading-relaxed whitespace-pre-line max-w-3xl">
            {kort.detaljer}
          </p>
        )}

        {/* Structured BYA subsection for regulering */}
        {kort.id === "regulering" && kort.raadata?.utnyttingsgrad != null && (
          <div className="bg-paper border border-paper-edge p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Utnyttelse og byggehøyde
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                  kort.raadata.utnyttelseKilde === "plan"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {kort.raadata.utnyttelseKilde === "plan"
                  ? "Fra plandata"
                  : "Veiledende"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {kort.raadata.utnyttingsgrad != null && (
                <div className="bg-paper-soft border border-paper-edge p-3 transition-all duration-200 hover:border-fjord-200 hover:shadow-sm kategori-bya-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BadgePercent className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="text-xs text-gray-500">Maks BYA</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.utnyttingsgrad}%
                  </p>
                </div>
              )}

              {kort.raadata.maksBebyggetAreal != null && (
                <div className="bg-paper-soft border border-paper-edge p-3 transition-all duration-200 hover:border-fjord-200 hover:shadow-sm kategori-bya-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="text-xs text-gray-500">Maks bebygd</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.maksBebyggetAreal} m²
                  </p>
                </div>
              )}

              {kort.raadata.maksHoyde != null && (
                <div className="bg-paper-soft border border-paper-edge p-3 transition-all duration-200 hover:border-fjord-200 hover:shadow-sm kategori-bya-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="text-xs text-gray-500">Maks høyde</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.maksHoyde} m
                  </p>
                </div>
              )}

              {kort.raadata.maksEtasjer != null && (
                <div className="bg-paper-soft border border-paper-edge p-3 transition-all duration-200 hover:border-fjord-200 hover:shadow-sm kategori-bya-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="text-xs text-gray-500">Maks etasjer</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {kort.raadata.maksEtasjer}
                  </p>
                </div>
              )}
            </div>

            {kort.raadata.utnyttelseKilde === "tek17" && (
              <p className="text-xs text-amber-600 leading-relaxed">
                Verdiene er veiledende TEK17-referanser basert på arealformålet og er ikke bindende.
                Faktisk tillatt utnyttelse kan avvike — sjekk kommunens reguleringsbestemmelser.
              </p>
            )}
          </div>
        )}

        {/* Structured kulturminner view */}
        {kort.id === "kulturminner" && kort.raadata?.minner && (
          <div className="bg-paper border border-paper-edge p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Registrerte kulturminner
            </p>
            <div className="space-y-2">
              {(kort.raadata.minner as Array<{ navn: string; kategori: string; vernetype: string; avstandMeter: number; lenke: string | null }>).map(
                (m, i) => {
                  const vLow = (m.vernetype || "").toLowerCase();
                  const erFredet =
                    vLow.includes("vedtaksfredet") ||
                    vLow.includes("forskriftsfredet") ||
                    vLow.includes("automatisk fredet");
                  const erListefort = vLow.includes("listeført") || vLow.includes("kommunalt");

                  return (
                    <div
                      key={i}
                      className="bg-paper-soft border border-paper-edge p-3 flex items-start gap-3"
                    >
                      <MapPin className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {m.navn}
                          </span>
                          {m.vernetype && (
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                                erFredet
                                  ? "bg-red-100 text-red-700"
                                  : erListefort
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {m.vernetype}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {m.kategori && <span>{m.kategori}</span>}
                          <span>{m.avstandMeter} m unna</span>
                        </div>
                        {m.lenke && (
                          <a
                            href={m.lenke}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-ink-muted hover:text-ink transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Se i Kulturminnesøk
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Structured solforhold view */}
        {kort.id === "solforhold" && kort.raadata?.sommer && kort.raadata?.vinter && (
          <div className="bg-paper border border-paper-edge p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Solforhold sommer vs. vinter
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Sommer */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-700">Sommer (21. juni)</p>
                <div className="bg-paper-soft border border-paper-edge p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Soloppgang</span>
                    <span className="font-semibold text-gray-900">
                      {kort.raadata.sommer.soloppgang}
                      {kort.raadata.sommer.soloppgangRetning && kort.raadata.sommer.soloppgangRetning !== "—" && (
                        <span className="text-xs text-gray-400 ml-1">({kort.raadata.sommer.soloppgangRetning})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Solnedgang</span>
                    <span className="font-semibold text-gray-900">
                      {kort.raadata.sommer.solnedgang}
                      {kort.raadata.sommer.solnedgangRetning && kort.raadata.sommer.solnedgangRetning !== "—" && (
                        <span className="text-xs text-gray-400 ml-1">({kort.raadata.sommer.solnedgangRetning})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daglengde</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.sommer.daglengdeTimer} t</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Solhøyde kl 12
                    </span>
                    <span className="font-semibold text-gray-900">{kort.raadata.sommer.solhoyde12}°</span>
                  </div>
                </div>
              </div>
              {/* Vinter */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-700">Vinter (21. des)</p>
                <div className="bg-paper-soft border border-paper-edge p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Soloppgang</span>
                    <span className="font-semibold text-gray-900">
                      {kort.raadata.vinter.soloppgang}
                      {kort.raadata.vinter.soloppgangRetning && kort.raadata.vinter.soloppgangRetning !== "—" && (
                        <span className="text-xs text-gray-400 ml-1">({kort.raadata.vinter.soloppgangRetning})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Solnedgang</span>
                    <span className="font-semibold text-gray-900">
                      {kort.raadata.vinter.solnedgang}
                      {kort.raadata.vinter.solnedgangRetning && kort.raadata.vinter.solnedgangRetning !== "—" && (
                        <span className="text-xs text-gray-400 ml-1">({kort.raadata.vinter.solnedgangRetning})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daglengde</span>
                    <span className="font-semibold text-gray-900">{kort.raadata.vinter.daglengdeTimer} t</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-blue-400" />
                      Solhøyde kl 12
                    </span>
                    <span className="font-semibold text-gray-900">{kort.raadata.vinter.solhoyde12}°</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sun arc chart */}
            {kort.raadata.sommer.bane && kort.raadata.vinter.bane && (
              <SolbaneGraf
                sommerBane={kort.raadata.sommer.bane}
                vinterBane={kort.raadata.vinter.bane}
              />
            )}

            {/* Hovedretning badge */}
            {kort.raadata.hovedretning && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Hovedsolretning:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                  <Sun className="w-3 h-3" />
                  {kort.raadata.hovedretning}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Raw data — hide for regulering when structured BYA data is shown, and hide for kulturminner */}
        {kort.raadata && Object.keys(kort.raadata).length > 0 &&
          !(kort.id === "regulering" && kort.raadata.utnyttingsgrad != null) &&
          kort.id !== "kulturminner" &&
          kort.id !== "solforhold" && (
          <div className="bg-paper border border-paper-edge p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Rådata
            </p>
            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-words">
              {JSON.stringify(kort.raadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Explanation — visible colored left border and darker background */}
        {forklaring && (
          <div className="bg-fjord-50 rounded-lg p-4 border border-fjord-200 border-l-4 border-l-fjord-500">
            <div className="flex items-center gap-2.5 mb-2">
              <Info className="w-5 h-5 text-ink-muted" />
              <span className="text-sm font-bold text-ink">
                Hva betyr dette?
              </span>
            </div>
            <p className="text-sm text-ink/80 leading-relaxed">
              {forklaring}
            </p>
          </div>
        )}

        {/* Source link */}
        {kort.kildeUrl && (
          <a
            href={kort.kildeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors print:hidden"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Kilde: {kort.kilde}
          </a>
        )}
      </div>
    </section>
  );
}
