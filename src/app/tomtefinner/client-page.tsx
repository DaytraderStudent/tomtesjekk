"use client";

import dynamic from "next/dynamic";

const TomtefinnerView = dynamic(() => import("./tomtefinner-view"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-fjord-200 border-t-fjord-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Laster Tomtefinner...</p>
      </div>
    </div>
  ),
});

export default function ClientPage() {
  return <TomtefinnerView />;
}
