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

function sanitizeText(text: string): string {
  // Strip markdown, then replace Norwegian characters that jsPDF default font can't render
  return stripMarkdown(text)
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "Ae")
    .replace(/ø/g, "o")
    .replace(/Ø/g, "O")
    .replace(/å/g, "aa")
    .replace(/Å/g, "Aa");
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

      // Title
      doc.setFontSize(22);
      doc.setTextColor(27, 63, 110); // fjord-500
      doc.text("Tomtesjekk Rapport", margin, y);
      y += 12;

      // Address
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const adresseTekst = sanitizeText(
        `${rapport.adresse.adressetekst}, ${rapport.adresse.postnummer} ${rapport.adresse.poststed}`
      );
      doc.text(adresseTekst, margin, y);
      y += 6;

      doc.text(
        `Generert: ${new Date(rapport.tidspunkt).toLocaleString("nb-NO")}`,
        margin,
        y
      );
      y += 10;

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
          sanitizeText(rapport.aiOppsummering.tekst),
          maxWidth
        );
        for (const line of aiLines) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
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
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Card title with status
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(
          sanitizeText(`${kort.tittel} — ${statusLabel(kort.status)}`),
          margin,
          y
        );
        y += 6;

        // Description
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const descLines = doc.splitTextToSize(
          sanitizeText(kort.beskrivelse),
          maxWidth
        );
        for (const line of descLines) {
          doc.text(line, margin, y);
          y += 4.5;
        }

        // Details
        if (kort.detaljer) {
          const detailLines = doc.splitTextToSize(
            sanitizeText(kort.detaljer),
            maxWidth
          );
          for (const line of detailLines) {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, margin, y);
            y += 4.5;
          }
        }

        // Source
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(sanitizeText(`Kilde: ${kort.kilde}`), margin, y);
        y += 8;
      }

      // Disclaimer
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const disclaimerLines = doc.splitTextToSize(
        sanitizeText(DISCLAIMER_TEXT),
        maxWidth
      );
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
