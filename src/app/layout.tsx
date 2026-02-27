import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tomtesjekk — Gratis AI-drevet tomteanalyse",
    template: "%s | Tomtesjekk",
  },
  description:
    "Sjekk flomfare, skred, radon, grunnforhold, byggekostnader og veitilgang for enhver tomt i Norge. Gratis AI-analyse på 60 sekunder.",
  keywords: [
    "tomtesjekk",
    "tomteanalyse",
    "flomfare",
    "skredfare",
    "radon",
    "grunnforhold",
    "byggekostnader",
    "norge",
    "eiendom",
  ],
  openGraph: {
    title: "Tomtesjekk — Gratis AI-drevet tomteanalyse",
    description:
      "Sjekk flomfare, skred, radon, grunnforhold, byggekostnader og veitilgang for enhver tomt i Norge.",
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
    <html lang="nb" className={`${fraunces.variable} ${sourceSans.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
