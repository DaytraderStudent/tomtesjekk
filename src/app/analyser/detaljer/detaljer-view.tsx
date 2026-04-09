"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, AlertTriangle, MapPin } from "lucide-react";
import { hentRapport } from "@/lib/rapport-storage";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DetaljerHero } from "@/components/DetaljerHero";
import { DetaljerKategori } from "@/components/DetaljerKategori";
import { DetaljerNav } from "@/components/DetaljerNav";
import { Bildegenerering } from "@/components/Bildegenerering";
import { StrukturertRapport } from "@/components/StrukturertRapport";
import { KlimaVisning } from "@/components/KlimaVisning";
import { FotoAnalyse } from "@/components/FotoAnalyse";
import { SdgSeksjon } from "@/components/SdgSeksjon";
import { PDFEksport } from "@/components/PDFEksport";
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
            <DetaljerNav kort={rapport.kort} pdfKnapp={<PDFEksport rapport={rapport} />} />
          </div>

          {/* Categories */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Structured AI report (tool use output) */}
            {rapport.aiOppsummering?.strukturert && (
              <StrukturertRapport
                data={rapport.aiOppsummering.strukturert}
                generert={rapport.aiOppsummering.generert}
              />
            )}

            {/* Climate projection 2100 */}
            <KlimaVisning adresse={rapport.adresse} />

            {/* AI photo analysis of aerial image */}
            <FotoAnalyse rapport={rapport} />

            {/* AI House Image (multi-angle) */}
            <Bildegenerering rapport={rapport} />

            {rapport.kort.map((kort) => (
              <DetaljerKategori
                key={kort.id}
                kort={kort}
                kartBilde={rapport.kartBilder?.[kort.id]}
              />
            ))}

            {/* UN SDG section */}
            <SdgSeksjon />

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
          className="w-12 h-12 bg-paper border border-paper-edge shadow-editorial-lg flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
          title="Tilbake til analyser"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PDFEksport rapport={rapport} />
      </div>
    </div>
  );
}
