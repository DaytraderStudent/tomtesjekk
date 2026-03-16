import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Droplets,
  Mountain,
  Radiation,
  Layers,
  TrendingUp,
  Route,
  Search,
  Cpu,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  Landmark,
  MapPin,
} from "lucide-react";

const features = [
  {
    icon: Droplets,
    title: "Flomfare",
    desc: "Aktsomhetsområder fra NVE",
    color: "#3B82F6",
  },
  {
    icon: Mountain,
    title: "Skred og kvikkleire",
    desc: "Skredfarekartlegging fra NVE",
    color: "#8B5CF6",
  },
  {
    icon: Radiation,
    title: "Radon",
    desc: "Aktsomhetskart fra NGU",
    color: "#F59E0B",
  },
  {
    icon: Layers,
    title: "Grunnforhold",
    desc: "Løsmassekart fra NGU",
    color: "#10B981",
  },
  {
    icon: TrendingUp,
    title: "Byggekostnader",
    desc: "Kostnadsindeks fra SSB",
    color: "#EF4444",
  },
  {
    icon: Route,
    title: "Veitilgang",
    desc: "Nærmeste vei fra NVDB",
    color: "#6366F1",
  },
];

const steps = [
  {
    icon: Search,
    title: "1. Søk adresse",
    desc: "Skriv inn adressen eller klikk på kartet",
  },
  {
    icon: Cpu,
    title: "2. Automatisk analyse",
    desc: "Vi henter data fra 6 offentlige kilder",
  },
  {
    icon: FileText,
    title: "3. Få rapporten",
    desc: "AI-tolket rapport med trafikklys og PDF-eksport",
  },
];

const comparison = [
  { feature: "Flomfare (NVE)", oss: true, manuelt: true },
  { feature: "Skredfare (NVE)", oss: true, manuelt: true },
  { feature: "Radon (NGU)", oss: true, manuelt: true },
  { feature: "Grunnforhold (NGU)", oss: true, manuelt: true },
  { feature: "Byggekostnader (SSB)", oss: true, manuelt: true },
  { feature: "Veitilgang (NVDB)", oss: true, manuelt: true },
  { feature: "Samlet i ett verktøy", oss: true, manuelt: false },
  { feature: "AI-tolkning", oss: true, manuelt: false },
  { feature: "PDF-rapport", oss: true, manuelt: false },
  { feature: "Tidsbruk", oss: "60 sek", manuelt: "2+ timer" },
];

const audiences = [
  {
    icon: Users,
    title: "Tomtekjøpere",
    desc: "Sjekk tomten før du kjøper. Unngå dyre overraskelser.",
  },
  {
    icon: Building2,
    title: "Eiendomsutviklere",
    desc: "Rask screening av potensielle tomter for utbygging.",
  },
  {
    icon: Landmark,
    title: "Meglere og rådgivere",
    desc: "Dokumenter tomtens egenskaper for kunder.",
  },
];

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-fjord-500 via-fjord-600 to-fjord-800 text-white overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

          {/* Topographic contour lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
              className="absolute -right-32 -top-32 w-[600px] h-[600px] opacity-[0.07] animate-contour-drift"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="200" cy="200" rx="60" ry="40" stroke="white" strokeWidth="1.5" transform="rotate(-15 200 200)" />
              <ellipse cx="200" cy="200" rx="100" ry="70" stroke="white" strokeWidth="1.5" transform="rotate(-15 200 200)" />
              <ellipse cx="200" cy="200" rx="140" ry="100" stroke="white" strokeWidth="1.5" transform="rotate(-15 200 200)" />
              <ellipse cx="200" cy="200" rx="180" ry="130" stroke="white" strokeWidth="1.5" transform="rotate(-15 200 200)" />
              <ellipse cx="200" cy="200" rx="220" ry="160" stroke="white" strokeWidth="1.2" transform="rotate(-15 200 200)" />
              <ellipse cx="200" cy="200" rx="260" ry="190" stroke="white" strokeWidth="1" transform="rotate(-15 200 200)" />
            </svg>
          </div>

          {/* Floating map pin */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none">
            <div className="animate-float-pin">
              <MapPin className="w-24 h-24 text-white/[0.08]" strokeWidth={1} />
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20 animate-badge-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-sm font-medium">Gratis for alle</span>
              </div>

              {/* Headline with glow */}
              <div className="relative">
                <div className="absolute -inset-x-8 -inset-y-4 bg-white/[0.04] rounded-3xl blur-3xl animate-headline-glow pointer-events-none" />
                <h1 className="relative font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  Alt du trenger å vite om tomten —{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-400">på 60 sekunder</span>
                </h1>
              </div>

              <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
                Tomtesjekk samler data fra 6 offentlige kilder og gir deg en
                AI-tolket rapport med flomfare, skred, radon, grunnforhold,
                byggekostnader og veitilgang.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/analyser"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-fjord-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 hover:-translate-y-0.5"
                >
                  <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
                  Analyser en tomt
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                  6 analyser, 1 rapport
                </h2>
                <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
                  Vi henter data fra Kartverket, NVE, NGU, SSB og Statens
                  vegvesen — automatisk.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 80}>
                  <div
                    className="feature-card group relative p-6 rounded-2xl border border-gray-100 hover:border-gray-200/80 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden"
                    style={{
                      "--feature-color": f.color,
                      "--feature-color-light": `${f.color}08`,
                    } as React.CSSProperties}
                  >
                    <div className="relative z-10">
                      <div
                        className="feature-icon-wrap w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${f.color}12` }}
                      >
                        <f.icon className="w-6 h-6" style={{ color: f.color }} />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {f.title}
                      </h3>
                      <p className="text-gray-500 mt-1">{f.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                  Slik fungerer det
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((s, i) => (
                <ScrollReveal key={s.title} delay={i * 120}>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fjord-400 to-fjord-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-fjord-500/25">
                      <s.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {s.title}
                    </h3>
                    <p className="text-gray-500 mt-2">{s.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                  Tomtesjekk vs. manuell research
                </h2>
                <p className="mt-3 text-lg text-gray-500">
                  Spar timer med arbeid — vi gjør jobben for deg.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="max-w-2xl mx-auto overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Funksjon
                      </th>
                      <th className="text-center px-4 py-4 text-sm font-semibold bg-fjord-50/60">
                        <div className="flex items-center justify-center gap-1.5 text-fjord-600">
                          <div className="w-5 h-5 rounded-full bg-fjord-500 flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-white" />
                          </div>
                          Tomtesjekk
                        </div>
                      </th>
                      <th className="text-center px-4 py-4 text-sm font-semibold text-gray-500">
                        Manuelt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={`${i % 2 === 0 ? "bg-white" : "bg-fjord-50/20"} transition-colors`}
                      >
                        <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">
                          {row.feature}
                        </td>
                        <td className={`text-center px-4 py-3.5 ${i % 2 === 0 ? "bg-fjord-50/30" : "bg-fjord-50/50"}`}>
                          {typeof row.oss === "boolean" ? (
                            row.oss ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-bold text-fjord-600">
                              {row.oss}
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3.5">
                          {typeof row.manuelt === "boolean" ? (
                            row.manuelt ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-500">
                              {row.manuelt}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Target audience */}
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                  Hvem er Tomtesjekk for?
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {audiences.map((a, i) => (
                <ScrollReveal key={a.title} delay={i * 100}>
                  <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-fjord-100 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fjord-50 to-fjord-100 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                      <a.icon className="w-6 h-6 text-fjord-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {a.title}
                    </h3>
                    <p className="text-gray-500 mt-2">{a.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 overflow-hidden">
          {/* Angled background */}
          <div className="absolute inset-0 bg-gradient-to-br from-fjord-500 via-fjord-600 to-fjord-700" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] animate-dot-pulse" />

          {/* Topographic accent */}
          <div className="absolute -left-20 -bottom-20 pointer-events-none">
            <svg
              className="w-[400px] h-[400px] opacity-[0.06]"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="200" cy="200" rx="80" ry="50" stroke="white" strokeWidth="1.5" transform="rotate(10 200 200)" />
              <ellipse cx="200" cy="200" rx="130" ry="90" stroke="white" strokeWidth="1.5" transform="rotate(10 200 200)" />
              <ellipse cx="200" cy="200" rx="180" ry="130" stroke="white" strokeWidth="1.2" transform="rotate(10 200 200)" />
              <ellipse cx="200" cy="200" rx="230" ry="170" stroke="white" strokeWidth="1" transform="rotate(10 200 200)" />
            </svg>
          </div>

          {/* Diagonal slant at top */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-surface" style={{ clipPath: "polygon(0 0, 100% 0, 100% 0%, 0 100%)" }} />

          <ScrollReveal>
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Klar til å sjekke tomten?
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Det tar bare 60 sekunder. Helt gratis, ingen registrering.
              </p>
              <Link
                href="/analyser"
                className="group inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-fjord-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Clock className="w-5 h-5 transition-transform group-hover:scale-110" />
                Start analyse nå
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
