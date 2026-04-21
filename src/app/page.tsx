import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnalyseDemo } from "@/components/HeroAnalyseDemo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowRight } from "lucide-react";

/* -------------------------------------------------------------------------
   Editorial landingsside — Tomtesjekk
   Aesthetic: Nordic geological survey meets architecture journal
   ------------------------------------------------------------------------- */

const dimensjoner = [
  {
    nummer: "01",
    tittel: "Naturfare",
    tema: ["Flom", "Skred", "Kvikkleire", "Radon"],
    kilder: [
      { navn: "NVE", url: "https://nve.no" },
      { navn: "NGU", url: "https://ngu.no" },
    ],
  },
  {
    nummer: "02",
    tittel: "Grunnforhold",
    tema: ["Løsmasser", "Fjellgrunn", "Jordart"],
    kilder: [{ navn: "NGU", url: "https://ngu.no" }],
  },
  {
    nummer: "03",
    tittel: "Reguleringsplan",
    tema: ["Arealformål", "BYA", "Byggehøyde", "Etasjer"],
    kilder: [
      { navn: "DiBK", url: "https://dibk.no" },
      { navn: "Geonorge", url: "https://geonorge.no" },
    ],
  },
  {
    nummer: "04",
    tittel: "Infrastruktur",
    tema: ["Veitilgang", "VA-tilknytning", "Støy"],
    kilder: [
      { navn: "NVDB", url: "https://nvdbapiles-v3.atlas.vegvesen.no" },
      { navn: "Statens vegvesen", url: "https://vegvesen.no" },
    ],
  },
  {
    nummer: "05",
    tittel: "Marked og økonomi",
    tema: ["Boligpriser", "Byggekostnader"],
    kilder: [{ navn: "SSB", url: "https://ssb.no" }],
  },
  {
    nummer: "06",
    tittel: "Mikroklima og SDG",
    tema: ["Solforhold", "Havstigning", "Klimaprognose 2100"],
    kilder: [
      { navn: "SunCalc", url: "https://github.com/mourner/suncalc" },
      { navn: "Kartverket", url: "https://kartverket.no" },
      { navn: "IPCC", url: "https://www.ipcc.ch" },
    ],
  },
];

const datakilder = [
  { navn: "Kartverket", url: "https://kartverket.no" },
  { navn: "NVE", url: "https://nve.no" },
  { navn: "NGU", url: "https://ngu.no" },
  { navn: "SSB", url: "https://ssb.no" },
  { navn: "Statens vegvesen", url: "https://vegvesen.no" },
  { navn: "DiBK", url: "https://dibk.no" },
  { navn: "Riksantikvaren", url: "https://riksantikvaren.no" },
  { navn: "Geonorge", url: "https://geonorge.no" },
  { navn: "SunCalc", url: "https://github.com/mourner/suncalc" },
];

export default function Home() {
  return (
    <>
      <Navigation />

      <main className="relative">
        {/* =========================================================
            HERO — editorial split
            ========================================================= */}
        <section className="relative border-b border-paper-edge bg-paper">
          {/* Masthead */}
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-10 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted">
              <span>Volum 01 — En uavhengig screening for norske eiendommer</span>
              <span className="hidden md:inline">
                Utgave {new Date().toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-14 lg:pb-24">
            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              {/* Editorial headline — takes 8 cols */}
              <div className="col-span-12 lg:col-span-8">
                <h1 className="font-display text-display-xl text-ink rise-in">
                  <span className="block">Sjekk hva</span>
                  <span className="block italic">grunnen sier</span>
                  <span className="block">før du kjøper.</span>
                </h1>
              </div>

              {/* Right rail — lede + CTA */}
              <div className="col-span-12 lg:col-span-4 lg:pt-6 flex flex-col justify-between gap-8">
                <p className="text-base text-ink-soft leading-relaxed max-w-md fade-up fade-up-2">
                  En uavhengig sammenstilling av flomfare, skredrisiko, radon,
                  grunnforhold, reguleringsplan og byggerammer — hentet fra de
                  samme offentlige kildene som arkitekter, geoteknikere og
                  kommuneforvaltning bruker.
                </p>

                <div className="flex flex-col gap-3 fade-up fade-up-3">
                  <Button asChild size="lg" variant="primary" className="self-start">
                    <Link href="/analyser">
                      Analyser en tomt
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    Ingen registrering · Gratis · Resultat på ~60 sek
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Animated report preview — simulates a live analysis */}
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-14 lg:pb-20 mt-10 fade-up fade-up-4">
            <HeroAnalyseDemo />
          </div>

          {/* Marquee — infinite scrolling data source ribbon */}
          <div className="border-t border-paper-edge bg-paper-deep/40 overflow-hidden">
            <div className="flex items-center">
              {/* Fixed label */}
              <div className="shrink-0 px-6 lg:px-12 py-4 border-r border-paper-edge bg-paper-deep/60 z-10">
                <span className="label-editorial">Datakilder</span>
              </div>

              {/* Scrolling track */}
              <div className="relative flex-1 overflow-hidden py-4">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-paper-deep/40 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-paper-deep/40 to-transparent z-10 pointer-events-none" />

                {/* Marquee track: duplicate content for seamless loop */}
                <div className="marquee-track flex items-center gap-10 whitespace-nowrap">
                  {[...datakilder, ...datakilder].map((kilde, i) => (
                    <a
                      key={`${kilde.navn}-${i}`}
                      href={kilde.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[12px] font-mono text-ink-soft tracking-wide hover:text-clay-500 transition-colors shrink-0"
                    >
                      {kilde.navn}
                      <span className="text-ink-faint">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            INTRO / INGRESS — editorial drop cap
            ========================================================= */}
        <section className="relative py-20 lg:py-28">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              <div className="col-span-12 lg:col-span-3">
                <span className="label-editorial block mb-3">Premiss</span>
                <h2 className="font-display text-display-sm text-ink">
                  Én beslutning.
                  <br />
                  Åtte portaler.
                </h2>
              </div>

              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                {/* Editorial illustration — a mini map frame */}
                <div className="mb-8 border border-paper-edge overflow-hidden">
                  <div className="bg-paper-deep p-4 flex items-center justify-between border-b border-paper-edge">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                      Kartverket topo — Grimstad, Agder
                    </span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-data-green" />
                      <div className="w-2 h-2 rounded-full bg-data-amber" />
                      <div className="w-2 h-2 rounded-full bg-data-red" />
                    </div>
                  </div>
                  {/* Map of Norwegian residential area — static composite */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero-kart.jpg"
                    alt="Kart over norsk boligområde — detalj fra OpenStreetMap"
                    className="w-full h-48 lg:h-64 object-cover"
                  />
                </div>

                <p className="font-display text-2xl lg:text-3xl leading-[1.4] tracking-tight text-ink">
                  <span className="float-left font-display text-[5.5rem] leading-[0.85] mr-3 mt-1 text-clay-500">
                    Å
                  </span>
                  kjøpe en tomt i Norge krever at du samler informasjon fra
                  Kartverket, NVE, NGU, SSB, Statens vegvesen, DiBK,
                  Riksantikvaren og kommunens planinnsyn. I praksis tar det to
                  timer per tomt. For en lekmann er det uoverkommelig.
                </p>

                <p className="mt-8 text-base text-ink-soft leading-relaxed max-w-2xl">
                  Tomtesjekk samler alle datakildene i én rapport på under ett
                  minutt, tolket av en AI som er forankret i TEK17, NVE-veileder
                  1/2019 og DSBs anbefalinger for klimatilpasning. Rapporten
                  erstatter ikke fagkyndig rådgivning — den gir deg grunnlaget
                  for å stille de riktige spørsmålene før du signerer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator ornamented />

        {/* =========================================================
            SEKS DIMENSJONER — editorial grid
            ========================================================= */}
        <section className="py-20 lg:py-28">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex items-end justify-between mb-12 lg:mb-16">
              <div>
                <span className="label-editorial block mb-3">Innhold</span>
                <h2 className="font-display text-display-md text-ink">
                  Seks dimensjoner.
                  <br />
                  Én samlet rapport.
                </h2>
              </div>
              <span className="hidden lg:block text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                § Hva rapporten dekker
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-paper-edge border border-paper-edge">
              {dimensjoner.map((d) => (
                <article
                  key={d.nummer}
                  className="bg-paper-soft p-8 lg:p-10 group relative"
                >
                  <div className="flex items-start justify-between mb-6">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                      {d.nummer} / 06
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-ink-faint group-hover:text-ink transition-colors" />
                  </div>

                  <h3 className="font-display text-2xl text-ink tracking-tight mb-4">
                    {d.tittel}
                  </h3>

                  <ul className="space-y-1 mb-6">
                    {d.tema.map((t) => (
                      <li
                        key={t}
                        className="text-sm text-ink-soft flex items-center gap-2"
                      >
                        <span className="w-3 h-px bg-ink-faint" />
                        {t}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-paper-edge flex flex-wrap items-center gap-x-3 gap-y-1">
                    {d.kilder.map((kilde, ki) => (
                      <span key={kilde.navn} className="inline-flex items-center">
                        <a
                          href={kilde.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono uppercase tracking-wider text-ink-muted hover:text-clay-500 transition-colors"
                        >
                          {kilde.navn}
                        </a>
                        {ki < d.kilder.length - 1 && (
                          <span className="text-ink-faint ml-3">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Separator ornamented />

        {/* =========================================================
            METODE — editorial three-column text
            ========================================================= */}
        <section className="py-20 lg:py-28">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              <div className="col-span-12 lg:col-span-3">
                <span className="label-editorial block mb-3">Metode</span>
                <h2 className="font-display text-display-sm text-ink">
                  Datadrevet.
                  <br />
                  Ikke spekulativ.
                </h2>
              </div>

              <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {/* Step 1 */}
                <div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-display text-4xl text-clay-500">
                      I.
                    </span>
                    <span className="label-editorial">Innhenting</span>
                  </div>
                  <p className="text-base text-ink-soft leading-relaxed">
                    Vi kaller 8 offentlige datakilder parallelt — alle
                    åpne, alle autoritative. Ingen proprietære kilder,
                    ingen påstander vi ikke kan bakke opp.
                  </p>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-display text-4xl text-clay-500">
                      II.
                    </span>
                    <span className="label-editorial">Tolkning</span>
                  </div>
                  <p className="text-base text-ink-soft leading-relaxed">
                    Claude Haiku oversetter tekniske funn til hverdagsspråk,
                    siterer relevante TEK17-paragrafer direkte, og rangerer
                    kostnadsrisiko med eksplisitte usikkerhetsmarkører.
                  </p>
                </div>

                {/* Step 3 */}
                <div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-display text-4xl text-clay-500">
                      III.
                    </span>
                    <span className="label-editorial">Kontekst</span>
                  </div>
                  <p className="text-base text-ink-soft leading-relaxed">
                    Gemini analyserer faktisk ortofoto av tomten for å
                    identifisere vegetasjon, adkomst og eksisterende
                    bebyggelse — multimodal grunnlegging mot virkelige forhold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            CTA — editorial closing statement
            ========================================================= */}
        <section className="relative bg-ink text-paper py-24 lg:py-32 overflow-hidden">
          {/* Subtle contour pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(245, 242, 235, 0.3) 1px, transparent 1px), radial-gradient(circle at 60% 30%, rgba(245, 242, 235, 0.2) 1px, transparent 1px)",
              backgroundSize: "48px 48px, 96px 96px",
            }}
          />

          <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-12 gap-6 lg:gap-10 items-end">
              <div className="col-span-12 lg:col-span-8">
                <span className="label-editorial block mb-6 text-paper/50">
                  Start
                </span>
                <h2 className="font-display text-display-lg">
                  Gi tomten din
                  <br />
                  <span className="italic text-clay-400">to minutter.</span>
                </h2>
                <p className="mt-8 text-lg text-paper/70 max-w-xl leading-relaxed">
                  Ingen registrering. Ingen bindinger. Bare en åpen rapport
                  bygget på offentlige data. Bruk den som utgangspunkt for
                  samtaler med arkitekt, geotekniker eller kommunen.
                </p>
              </div>

              <div className="col-span-12 lg:col-span-4 flex lg:justify-end">
                <Button asChild size="xl" variant="clay">
                  <Link href="/analyser">
                    Start analyse
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
