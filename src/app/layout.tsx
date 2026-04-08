import type { Metadata } from "next";
import { Fraunces, Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tomtesjekk — Tomteanalyse for norske eiendommer",
    template: "%s · Tomtesjekk",
  },
  description:
    "En uavhengig screening av flomfare, skred, radon, grunnforhold, reguleringsplan og byggerammer for enhver tomt i Norge. Basert på offentlige data fra Kartverket, NVE, NGU, SSB og DiBK.",
  keywords: [
    "tomtesjekk",
    "tomteanalyse",
    "flomfare",
    "skredfare",
    "radon",
    "grunnforhold",
    "byggekostnader",
    "reguleringsplan",
    "norge",
    "eiendom",
  ],
  openGraph: {
    title: "Tomtesjekk — Tomteanalyse for norske eiendommer",
    description:
      "En uavhengig screening av flomfare, skred, radon, grunnforhold, reguleringsplan og byggerammer for enhver tomt i Norge.",
    locale: "nb_NO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nb"
      className={`${fraunces.variable} ${bricolage.variable} ${plexMono.variable}`}
    >
      <body className="font-sans antialiased bg-paper text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
