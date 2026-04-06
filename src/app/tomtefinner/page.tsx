import type { Metadata } from "next";
import ClientPage from "./client-page";

export const metadata: Metadata = {
  title: "AI Tomtefinner — Tomtesjekk",
  description:
    "La AI finne den beste tomten for ditt byggeprosjekt. Oppgi krav og få forslag til tomter basert på regulering, naturfare, solforhold og mer.",
};

export default function TomtefinnerPage() {
  return <ClientPage />;
}
