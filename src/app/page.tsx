import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroCounter } from "@/components/HeroCounter";
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
    num: "1",
    icon: Search,
    title: "Søk adresse",
    desc: "Skriv inn adressen eller klikk på kartet",
  },
  {
    num: "2",
    icon: Cpu,
    title: "Automatisk analyse",
    desc: "Vi henter data fra 6 offentlige kilder",
  },
  {
    num: "3",
    icon: FileText,
    title: "Få rapporten",
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
    accent: "#3B82F6",
  },
  {
    icon: Building2,
    title: "Eiendomsutviklere",
    desc: "Rask screening av potensielle tomter for utbygging.",
    accent: "#10B981",
  },
  {
    icon: Landmark,
    title: "Meglere og rådgivere",
    desc: "Dokumenter tomtens egenskaper for kunder.",
    accent: "#8B5CF6",
  },
];

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative min-h-[90vh] flex items-center bg-fjord-800 text-white overflow-hidden">
          {/* Aurora mesh background */}
          <div className="hero-aurora" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

          {/* Topographic contour lines — BOLD */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
              className="absolute -right-20 -top-20 w-[700px] h-[700px] opacity-[0.22] animate-contour-drift"
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

            {/* Second contour set — bottom left */}
            <svg
              className="absolute -left-32 -bottom-32 w-[500px] h-[500px] opacity-[0.15] animate-contour-drift-reverse"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="200" cy="200" rx="70" ry="50" stroke="#10B981" strokeWidth="1.5" transform="rotate(25 200 200)" />
              <ellipse cx="200" cy="200" rx="120" ry="85" stroke="#10B981" strokeWidth="1.5" transform="rotate(25 200 200)" />
              <ellipse cx="200" cy="200" rx="170" ry="120" stroke="#10B981" strokeWidth="1.2" transform="rotate(25 200 200)" />
              <ellipse cx="200" cy="200" rx="220" ry="155" stroke="#10B981" strokeWidth="1" transform="rotate(25 200 200)" />
            </svg>
          </div>

          {/* Animated terrain illustration */}
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none">
            <div className="hero-terrain-illustration">
              <svg
                className="w-[380px] h-[380px]"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Terrain layers */}
                <path
                  d="M40 320 L80 260 L120 280 L160 220 L200 240 L240 180 L280 200 L320 160 L360 180 L360 380 L40 380 Z"
                  fill="rgba(16,185,129,0.12)"
                  stroke="rgba(16,185,129,0.4)"
                  strokeWidth="2"
                  className="hero-terrain-layer hero-terrain-layer-1"
                />
                <path
                  d="M40 340 L100 290 L140 310 L180 260 L220 280 L260 230 L300 250 L340 210 L360 220 L360 380 L40 380 Z"
                  fill="rgba(59,130,246,0.1)"
                  stroke="rgba(59,130,246,0.35)"
                  strokeWidth="2"
                  className="hero-terrain-layer hero-terrain-layer-2"
                />
                <path
                  d="M40 360 L120 320 L160 340 L200 300 L240 320 L280 280 L320 300 L360 270 L360 380 L40 380 Z"
                  fill="rgba(139,92,246,0.08)"
                  stroke="rgba(139,92,246,0.3)"
                  strokeWidth="2"
                  className="hero-terrain-layer hero-terrain-layer-3"
                />
                {/* Map pin */}
                <g className="hero-terrain-pin">
                  <circle cx="240" cy="165" r="18" fill="rgba(16,185,129,0.25)" stroke="#10B981" strokeWidth="2" />
                  <circle cx="240" cy="165" r="6" fill="#10B981" />
                  <circle cx="240" cy="165" r="24" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="1" className="hero-pin-ring" />
                </g>
                {/* Contour labels */}
                <text x="365" y="185" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace">200m</text>
                <text x="365" y="225" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">150m</text>
                <text x="365" y="275" fill="rgba(255,255,255,0.15)" fontSize="10" fontFamily="monospace">100m</text>
              </svg>
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10">
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
                <div className="absolute -inset-x-8 -inset-y-4 bg-gradient-to-r from-emerald-500/10 via-fjord-400/15 to-emerald-500/10 rounded-3xl blur-3xl animate-headline-glow pointer-events-none" />
                <h1 className="relative font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  Alt du trenger å vite om tomten —{" "}
                  <span className="hero-gradient-text">
                    på <HeroCounter target={60} /> sekunder
                  </span>
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
                  className="hero-cta-button group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-fjord-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 hover:-translate-y-0.5"
                >
                  <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
                  Analyser en tomt
                </Link>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
              <path d="M0 40 C360 80 720 0 1080 40 C1260 60 1380 50 1440 45 L1440 100 L0 100 Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ═══ Features ═══ */}
        <section className="py-20 bg-white relative">
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

            {/* Connecting dots background */}
            <div className="features-connector-bg" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 80}>
                  <div
                    className="glass-card group relative p-6 rounded-2xl overflow-hidden"
                    style={{
                      "--feature-color": f.color,
                      "--feature-color-20": `${f.color}33`,
                      "--feature-color-10": `${f.color}1a`,
                      "--feature-color-40": `${f.color}66`,
                    } as React.CSSProperties}
                  >
                    <div className="relative z-10">
                      <div
                        className="glass-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: `linear-gradient(135deg, ${f.color}25, ${f.color}40)`,
                          boxShadow: `0 4px 15px ${f.color}30`,
                        }}
                      >
                        <f.icon className="w-7 h-7" style={{ color: f.color }} />
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

          {/* Angled divider to next section */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
              <path d="M0 60 L1440 20 L1440 60 Z" fill="#F8F9FA" />
            </svg>
          </div>
        </section>

        {/* ═══ How it works ═══ */}
        <section className="py-20 bg-surface relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                  Slik fungerer det
                </h2>
              </div>
            </ScrollReveal>
            <div className="relative max-w-4xl mx-auto">
              {/* Horizontal connector line */}
              <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[3px] steps-connector-line" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((s, i) => (
                  <ScrollReveal key={s.title} delay={i * 150} className="steps-slide-in">
                    <div className="text-center relative">
                      {/* Number circle with glow */}
                      <div className="step-number-wrap mx-auto mb-6">
                        <div className="step-number-glow" />
                        <div className="step-number-circle">
                          <span className="text-2xl font-bold text-white">{s.num}</span>
                        </div>
                      </div>
                      <div className="step-icon-badge mx-auto mb-3">
                        <s.icon className="w-5 h-5 text-fjord-500" />
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
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
              <path d="M0 20 C480 60 960 0 1440 30 L1440 60 L0 60 Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ═══ Comparison ═══ */}
        <section className="py-20 bg-white relative">
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
              <div className="comparison-table-wrap max-w-2xl mx-auto overflow-hidden rounded-2xl">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-6 py-5 text-sm font-semibold text-gray-500 bg-gray-50/80">
                        Funksjon
                      </th>
                      <th className="text-center px-4 py-5 text-sm font-semibold comparison-highlight-header">
                        <div className="flex items-center justify-center gap-1.5 text-fjord-700">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fjord-400 to-fjord-600 flex items-center justify-center shadow-md shadow-fjord-500/30">
                            <MapPin className="w-3.5 h-3.5 text-white" />
                          </div>
                          Tomtesjekk
                        </div>
                      </th>
                      <th className="text-center px-4 py-5 text-sm font-semibold text-gray-400 bg-gray-50/80">
                        Manuelt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => {
                      const isTimeRow = row.feature === "Tidsbruk";
                      return (
                        <tr
                          key={row.feature}
                          className={`comparison-row ${isTimeRow ? "comparison-time-row" : ""}`}
                        >
                          <td className={`px-6 text-sm font-medium ${isTimeRow ? "py-5 text-gray-900 text-base" : "py-3.5 text-gray-700"}`}>
                            {row.feature}
                          </td>
                          <td className={`text-center px-4 comparison-highlight-cell ${isTimeRow ? "py-5" : "py-3.5"}`}>
                            {typeof row.oss === "boolean" ? (
                              row.oss ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className={`font-bold ${isTimeRow ? "text-xl text-emerald-600" : "text-sm text-fjord-600"}`}>
                                {row.oss}
                              </span>
                            )}
                          </td>
                          <td className={`text-center px-4 ${isTimeRow ? "py-5" : "py-3.5"}`}>
                            {typeof row.manuelt === "boolean" ? (
                              row.manuelt ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className={`${isTimeRow ? "text-xl font-bold text-red-400" : "text-sm text-gray-500"}`}>
                                {row.manuelt}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </div>

          {/* Gradient fade divider */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-surface" />
        </section>

        {/* ═══ Target audience ═══ */}
        <section className="py-20 bg-surface relative">
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
                  <div
                    className="audience-card group relative bg-white p-6 rounded-2xl border border-gray-100 overflow-hidden"
                    style={{ "--audience-accent": a.accent } as React.CSSProperties}
                  >
                    {/* Colored top border */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                      style={{ background: a.accent }}
                    />
                    {/* Hover gradient fill */}
                    <div className="audience-hover-fill" />
                    <div className="relative z-10">
                      <div
                        className="audience-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: `linear-gradient(135deg, ${a.accent}15, ${a.accent}25)`,
                        }}
                      >
                        <a.icon className="w-7 h-7" style={{ color: a.accent }} />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {a.title}
                      </h3>
                      <p className="text-gray-500 mt-2">{a.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Angled divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
              <path d="M0 80 L0 40 C360 70 720 10 1080 40 C1260 55 1380 45 1440 40 L1440 80 Z" fill="#0B1A2C" />
            </svg>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="relative py-28 overflow-hidden">
          {/* Dark gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-fjord-800 via-fjord-900 to-[#030a14]" />

          {/* Animated floating shapes */}
          <div className="cta-floating-shapes">
            <div className="cta-shape cta-shape-1" />
            <div className="cta-shape cta-shape-2" />
            <div className="cta-shape cta-shape-3" />
            <div className="cta-shape cta-shape-4" />
            <div className="cta-shape cta-shape-5" />
          </div>

          {/* Decorative circles */}
          <div className="absolute top-10 right-[15%] w-32 h-32 rounded-full border border-white/[0.06] pointer-events-none" />
          <div className="absolute bottom-16 left-[10%] w-48 h-48 rounded-full border border-emerald-500/[0.08] pointer-events-none" />
          <div className="absolute top-1/2 right-[8%] w-20 h-20 rounded-full border border-fjord-400/[0.1] pointer-events-none" />

          {/* Decorative lines */}
          <div className="absolute top-20 left-[20%] w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-20 right-[25%] w-px h-32 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent pointer-events-none" />

          {/* Topographic accent */}
          <div className="absolute -left-20 -bottom-20 pointer-events-none">
            <svg
              className="w-[400px] h-[400px] opacity-[0.12]"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="200" cy="200" rx="80" ry="50" stroke="#10B981" strokeWidth="1.5" transform="rotate(10 200 200)" />
              <ellipse cx="200" cy="200" rx="130" ry="90" stroke="#10B981" strokeWidth="1.5" transform="rotate(10 200 200)" />
              <ellipse cx="200" cy="200" rx="180" ry="130" stroke="#10B981" strokeWidth="1.2" transform="rotate(10 200 200)" />
              <ellipse cx="200" cy="200" rx="230" ry="170" stroke="#10B981" strokeWidth="1" transform="rotate(10 200 200)" />
            </svg>
          </div>

          <ScrollReveal>
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Klar til å sjekke tomten?
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Det tar bare 60 sekunder. Helt gratis, ingen registrering.
              </p>
              <Link
                href="/analyser"
                className="cta-glow-button group inline-flex items-center gap-2 mt-8 px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-lg transition-all hover:-translate-y-1"
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
