import type { Metadata } from "next";
import AnalyserClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Analyser tomt",
  description:
    "Søk en adresse og få en komplett tomteanalyse med flomfare, skredfare, radon, grunnforhold, byggekostnader og veitilgang.",
};

export default function AnalyserPage() {
  return <AnalyserClientPage />;
}
