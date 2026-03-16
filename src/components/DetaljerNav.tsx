"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusFarge, statusLabel } from "@/lib/trafikklys";
import { hentKortIkon } from "@/lib/kort-ikoner";
import type { AnalyseKort } from "@/types";

interface Props {
  kort: AnalyseKort[];
  onPrint?: () => void;
}

export function DetaljerNav({ kort, onPrint }: Props) {
  const [aktivId, setAktivId] = useState<string>(kort[0]?.id || "");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mobilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("kategori-", "");
            setAktivId(id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );

    for (const k of kort) {
      const el = document.getElementById(`kategori-${k.id}`);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [kort]);

  // Auto-scroll mobile nav to keep active pill visible
  useEffect(() => {
    if (!mobilRef.current) return;
    const activeBtn = mobilRef.current.querySelector(`[data-nav="${aktivId}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [aktivId]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`kategori-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Desktop: vertical sticky sidebar */}
      <nav className="hidden lg:block sticky top-24 w-64 shrink-0 print:hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          Kategorier
        </p>
        <ul className="space-y-1">
          {kort.map((k) => {
            const { icon: Icon } = hentKortIkon(k.id);
            const farge = statusFarge(k.status);
            const erAktiv = aktivId === k.id;
            const risikoLabel = statusLabel(k.status);

            return (
              <li key={k.id}>
                <button
                  onClick={() => scrollTo(k.id)}
                  className={cn(
                    "nav-sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all relative",
                    erAktiv
                      ? "bg-fjord-50 text-fjord-700 font-semibold border-l-4 border-l-fjord-500 pl-4"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {/* Traffic light dot with glow */}
                  <span
                    className="w-3 h-3 rounded-full shrink-0 nav-traffic-dot"
                    style={{
                      backgroundColor: farge,
                      boxShadow: `0 0 8px ${farge}80`,
                    }}
                  />
                  <Icon className={cn(
                    "w-4 h-4 shrink-0 transition-opacity duration-200",
                    erAktiv ? "opacity-100" : "opacity-60"
                  )} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{k.tittel}</span>
                    <span
                      className="text-[10px] font-medium leading-tight truncate"
                      style={{ color: farge }}
                    >
                      {risikoLabel}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {onPrint && (
          <button
            onClick={onPrint}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-fjord-500 text-white rounded-lg text-sm font-semibold hover:bg-fjord-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Last ned PDF
          </button>
        )}
      </nav>

      {/* Mobile: horizontal scrolling pills — colorful status tinting */}
      <div
        ref={mobilRef}
        className="lg:hidden sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 overflow-x-auto print:hidden"
      >
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {kort.map((k) => {
            const farge = statusFarge(k.status);
            const erAktiv = aktivId === k.id;

            return (
              <button
                key={k.id}
                data-nav={k.id}
                onClick={() => scrollTo(k.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  erAktiv
                    ? "text-white shadow-md scale-105"
                    : "text-gray-700 hover:opacity-90"
                )}
                style={
                  erAktiv
                    ? { backgroundColor: farge, boxShadow: `0 2px 10px ${farge}50` }
                    : { backgroundColor: `${farge}18` }
                }
              >
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200",
                    erAktiv && "scale-125"
                  )}
                  style={{
                    backgroundColor: erAktiv ? "white" : farge,
                    boxShadow: erAktiv ? "none" : `0 0 6px ${farge}60`,
                  }}
                />
                {k.tittel}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
