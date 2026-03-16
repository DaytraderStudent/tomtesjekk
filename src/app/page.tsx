import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Droplets,
  Mountain,
  Radiation,
  Layers,
  TrendingUp,
  Route,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  ArrowRight,
  Shield,
  Zap,
  FileText,
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

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        {/* Hero — clean, confident, no gimmicks */}
        <section className="relative bg-fjord-700 text-white">
          <div className="absolute inset-0 bg-gradient-to-b from-fjord-800/50 to-fjord-700/0" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="max-w-2xl">
              <p className="text-fjord-200 text-sm font-medium tracking-wide uppercase mb-4">
                Gratis tomteanalyse for hele Norge
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight">
                Sjekk tomten
                <br />
                <span className="text-emerald-400">før du kjøper.</span>
              </h1>
              <p className="mt-6 text-lg text-fjord-200 leading-relaxed max-w-xl">
                Tomtesjekk henter data fra 6 offentlige kilder og gir deg en
                komplett rapport med flomfare, skredrisiko, radon, grunnforhold,
                byggekostnader og veitilgang — på under ett minutt.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/analyser"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-500 text-white rounded-lg font-semibold text-base hover:bg-emerald-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  Analyser en tomt
                </Link>
                <span className="text-fjord-300 text-sm">
                  Ingen registrering nødvendig
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-fjord-500" />
                Offentlige datakilder
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-fjord-500" />
                Resultat på 60 sekunder
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-fjord-500" />
                AI-tolket PDF-rapport
              </span>
            </div>
          </div>
        </section>

        {/* What we check */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Hva sjekker vi?
            </h2>
            <p className="text-gray-500 mb-10 max-w-xl">
              Data fra Kartverket, NVE, NGU, SSB og Statens vegvesen — samlet i
              én rapport.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.color}12` }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
                Tomtesjekk vs. manuell sjekk
              </h2>
              <p className="text-gray-500 text-center mb-8">
                Spar timer med research — vi gjør jobben for deg.
              </p>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Datapunkt
                      </th>
                      <th className="text-center px-4 py-3.5 text-xs font-semibold text-fjord-600 uppercase tracking-wider bg-fjord-50/50">
                        Tomtesjekk
                      </th>
                      <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Manuelt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {comparison.map((row) => (
                      <tr key={row.feature}>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {row.feature}
                        </td>
                        <td className="text-center px-4 py-3 bg-fjord-50/30">
                          {typeof row.oss === "boolean" ? (
                            row.oss ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="w-4.5 h-4.5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-semibold text-emerald-600">
                              {row.oss}
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3">
                          {typeof row.manuelt === "boolean" ? (
                            row.manuelt ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="w-4.5 h-4.5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-400">
                              {row.manuelt}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA — simple */}
        <section className="py-16 lg:py-20 bg-fjord-700">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              Klar til å sjekke tomten?
            </h2>
            <p className="text-fjord-200 mb-8">
              Helt gratis. Ingen registrering. Rapport på under ett minutt.
            </p>
            <Link
              href="/analyser"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-500 text-white rounded-lg font-semibold text-base hover:bg-emerald-600 transition-colors"
            >
              Start analyse
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
