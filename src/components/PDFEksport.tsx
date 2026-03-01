"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { statusLabel } from "@/lib/trafikklys";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import type { Rapport } from "@/types";

interface Props {
  rapport: Rapport;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/[✓✗⚠△▲●]/g, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n");
}

let cachedFontBase64: string | null = null;

async function loadUnicodeFont(): Promise<string | null> {
  if (cachedFontBase64) return cachedFontBase64;
  try {
    // Inter Latin Extended — supports æøå and other European chars
    const res = await fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
    );
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    cachedFontBase64 = btoa(binary);
    return cachedFontBase64;
  } catch {
    return null;
  }
}

export function PDFEksport({ rapport }: Props) {
  const [genererer, setGenererer] = useState(false);

  const genererPDF = async () => {
    setGenererer(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      // Try to load Unicode font for proper æøå support
      const fontData = await loadUnicodeFont();
      if (fontData) {
        doc.addFileToVFS("Inter-Regular.ttf", fontData);
        doc.addFont("Inter-Regular.ttf", "Inter", "normal");
        doc.setFont("Inter");
      }

      const clean = (text: string) => {
        const stripped = stripMarkdown(text);
        // If we have a Unicode font, keep Norwegian chars. Otherwise fallback.
        if (fontData) return stripped;
        return stripped
          .replace(/æ/g, "ae").replace(/Æ/g, "Ae")
          .replace(/ø/g, "o").replace(/Ø/g, "O")
          .replace(/å/g, "aa").replace(/Å/g, "Aa");
      };

      // Title
      doc.setFontSize(22);
      doc.setTextColor(27, 63, 110);
      doc.text("Tomtesjekk Rapport", margin, y);
      y += 12;

      // Address
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(
        clean(`${rapport.adresse.adressetekst}, ${rapport.adresse.postnummer} ${rapport.adresse.poststed}`),
        margin, y
      );
      y += 6;

      // Elevation
      if (rapport.hoydeOverHavet !== null) {
        doc.text(
          clean(`Hoyde over havet: ${rapport.hoydeOverHavet} m`),
          margin, y
        );
        y += 6;
      }

      doc.text(
        `Generert: ${new Date(rapport.tidspunkt).toLocaleString("nb-NO")}`,
        margin, y
      );
      y += 10;

      // Map image
      if (rapport.kartBilde) {
        const imgWidth = maxWidth;
        const imgHeight = imgWidth * 0.6; // ~170×100mm aspect ratio
        if (y + imgHeight > 270) { doc.addPage(); y = 20; }
        doc.addImage(rapport.kartBilde, "PNG", margin, y, imgWidth, imgHeight);
        y += imgHeight + 3;
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Kartdata: OpenStreetMap", margin, y);
        y += 8;
      }

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // AI Summary
      if (rapport.aiOppsummering) {
        doc.setFontSize(14);
        doc.setTextColor(27, 63, 110);
        doc.text("AI-oppsummering", margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const aiLines = doc.splitTextToSize(
          clean(rapport.aiOppsummering.tekst),
          maxWidth
        );
        for (const line of aiLines) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += 5;
        }
        y += 8;
      }

      // Analysis cards
      doc.setFontSize(14);
      doc.setTextColor(27, 63, 110);
      doc.text("Analyseresultater", margin, y);
      y += 10;

      for (const kort of rapport.kort) {
        if (y > 250) { doc.addPage(); y = 20; }

        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(
          clean(`${kort.tittel} \u2014 ${statusLabel(kort.status)}`),
          margin, y
        );
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const descLines = doc.splitTextToSize(clean(kort.beskrivelse), maxWidth);
        for (const line of descLines) {
          doc.text(line, margin, y);
          y += 4.5;
        }

        if (kort.detaljer) {
          const detailLines = doc.splitTextToSize(clean(kort.detaljer), maxWidth);
          for (const line of detailLines) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(line, margin, y);
            y += 4.5;
          }
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(clean(`Kilde: ${kort.kilde}`), margin, y);
        y += 8;
      }

      // Disclaimer
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const disclaimerLines = doc.splitTextToSize(clean(DISCLAIMER_TEXT), maxWidth);
      for (const line of disclaimerLines) {
        doc.text(line, margin, y);
        y += 4;
      }

      // Save
      const filnavn = rapport.adresse.adressetekst
        .toLowerCase()
        .replace(/[^a-zæøå0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      doc.save(`tomtesjekk-rapport-${filnavn}.pdf`);
    } finally {
      setGenererer(false);
    }
  };

  return (
    <button
      onClick={genererPDF}
      disabled={genererer}
      className="flex items-center gap-2 px-4 py-2 bg-fjord-500 text-white rounded-lg hover:bg-fjord-600 disabled:opacity-50 transition-colors text-sm font-medium"
    >
      {genererer ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Last ned PDF
    </button>
  );
}
