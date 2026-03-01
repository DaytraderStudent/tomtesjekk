import type { Metadata } from "next";
import DetaljerClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Detaljert rapport",
  description:
    "Fullstendig tomteanalyserapport med flomfare, skredfare, radon, grunnforhold, reguleringsplan og mer.",
};

export default function DetaljerPage() {
  return <DetaljerClientPage />;
}
