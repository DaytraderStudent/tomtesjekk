"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, AlertTriangle, MapPin, Download } from "lucide-react";
import { hentRapport } from "@/lib/rapport-storage";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DetaljerHero } from "@/components/DetaljerHero";
import { DetaljerKategori } from "@/components/DetaljerKategori";
import { DetaljerNav } from "@/components/DetaljerNav";
import { Bildegenerering } from "@/components/Bildegenerering";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import type { Rapport } from "@/types";

export default function DetaljerView() {
  const router = useRouter();
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [laster, setLaster] = useState(true);

  useEffect(() => {
    const data = hentRapport();
    if (!data) {
      router.replace("/analyser");
      return;
    }
    setRapport(data);
    setLaster(false);
  }, [router]);

  if (laster || !rapport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-fjord-200 border-t-fjord-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Laster rapport…</p>
        </div>
      </div>
    );
  }

  const dato = new Date(rapport.tidspunkt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      {/* Print-only cover page */}
      <div className="print-cover hidden">
        <div className="print-cover-logo">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <h1>Tomtesjekk</h1>
        <h2>{rapport.adresse.adressetekst}</h2>
        {rapport.adresse.kommunenavn && (
          <p style={{ fontSize: "12pt", color: "#6B7280" }}>
            {rapport.adresse.kommunenavn}
            {rapport.adresse.postnummer && ` — ${rapport.adresse.postnummer} ${rapport.adresse.poststed}`}
          </p>
        )}
        <div className="print-cover-meta">
          <p>Generert {dato}</p>
          <p style={{ marginTop: "8px" }}>tomtesjekk.no</p>
        </div>
      </div>

      <DetaljerHero rapport={rapport} />

      {/* Mobile navigation pills (hidden on desktop) */}
      <div className="lg:hidden">
        <DetaljerNav kort={rapport.kort} />
      </div>

      {/* Main content with desktop sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex gap-8">
          {/* Desktop sidebar nav (hidden on mobile) */}
          <div className="hidden lg:block">
            <DetaljerNav kort={rapport.kort} onPrint={() => window.print()} />
          </div>

          {/* Categories */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* AI House Image */}
            <Bildegenerering rapport={rapport} />

            {rapport.kort.map((kort) => (
              <DetaljerKategori
                key={kort.id}
                kort={kort}
                kartBilde={rapport.kartBilder?.[kort.id]}
              />
            ))}

            {/* Disclaimer (screen) */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 print:hidden">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                {DISCLAIMER_TEXT}
              </p>
            </div>

            {/* Disclaimer (print-only) */}
            <div className="print-disclaimer hidden">
              <p><strong>Ansvarsfraskrivelse:</strong> {DISCLAIMER_TEXT}</p>
              <p style={{ marginTop: "8px" }}>
                Rapport generert {dato} av Tomtesjekk (tomtesjekk.no).
                Datakilder: Kartverket, NVE, NGU, SSB, Statens vegvesen, DiBK, Riksantikvaren, SunCalc.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 print:hidden">
        <button
          onClick={() => router.push("/analyser")}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-fjord-500 hover:border-fjord-200 transition-colors"
          title="Tilbake til analyser"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => window.print()}
          className="w-12 h-12 bg-fjord-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-fjord-600 transition-colors"
          title="Last ned PDF"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
