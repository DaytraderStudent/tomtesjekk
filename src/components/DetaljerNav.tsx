"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusFarge } from "@/lib/trafikklys";
import { Button } from "./ui/button";
import type { AnalyseKort } from "@/types";

interface Props {
  kort: AnalyseKort[];
  onPrint?: () => void;
}

/* -------------------------------------------------------------------------
   DetaljerNav — editorial sticky index
   Numbered list with status dot, no icons, minimal chrome
   ------------------------------------------------------------------------- */

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
      {/* Desktop: editorial sticky sidebar */}
      <nav className="hidden lg:block sticky top-24 w-64 shrink-0 print:hidden">
        <span className="label-editorial block mb-5 px-3">Innhold</span>
        <ol className="space-y-0">
          {kort.map((k, i) => {
            const farge = statusFarge(k.status);
            const erAktiv = aktivId === k.id;

            return (
              <li key={k.id}>
                <button
                  onClick={() => scrollTo(k.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-3 text-left transition-colors border-l-[2px]",
                    erAktiv
                      ? "bg-paper-deep border-l-ink text-ink"
                      : "border-l-transparent text-ink-muted hover:text-ink hover:bg-paper-deep/40"
                  )}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mt-0.5 w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: farge }}
                    />
                    <span
                      className={cn(
                        "text-[13px] truncate",
                        erAktiv && "font-medium"
                      )}
                    >
                      {k.tittel}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {onPrint && (
          <Button
            onClick={onPrint}
            variant="primary"
            size="sm"
            className="mt-6 w-full"
          >
            <Download className="w-3.5 h-3.5" />
            Last ned PDF
          </Button>
        )}
      </nav>

      {/* Mobile: horizontal scrolling strip */}
      <div
        ref={mobilRef}
        className="lg:hidden sticky top-16 z-40 bg-paper/95 backdrop-blur-md border-b border-paper-edge overflow-x-auto print:hidden"
      >
        <div className="flex gap-0 px-4 min-w-max">
          {kort.map((k, i) => {
            const farge = statusFarge(k.status);
            const erAktiv = aktivId === k.id;

            return (
              <button
                key={k.id}
                data-nav={k.id}
                onClick={() => scrollTo(k.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[11px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors border-b-2",
                  erAktiv
                    ? "border-b-ink text-ink"
                    : "border-b-transparent text-ink-muted hover:text-ink"
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: farge }}
                />
                <span className="text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                {k.tittel}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
