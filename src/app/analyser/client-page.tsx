"use client";

import dynamic from "next/dynamic";

const AnalyserView = dynamic(() => import("./analyser-view"), { ssr: false });

export default function AnalyserClientPage() {
  return <AnalyserView />;
}
