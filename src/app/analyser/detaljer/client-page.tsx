"use client";

import dynamic from "next/dynamic";

const DetaljerView = dynamic(() => import("./detaljer-view"), { ssr: false });

export default function DetaljerClientPage() {
  return <DetaljerView />;
}
