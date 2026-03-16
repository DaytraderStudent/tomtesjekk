"use client";

import { Check, Loader2, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyseSteg } from "@/types";

interface Props {
  steg: AnalyseSteg[];
  prosent: number;
}

function StegIkon({ status }: { status: AnalyseSteg["status"] }) {
  switch (status) {
    case "ferdig":
      return (
        <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center steg-ferdig-enter shadow-md shadow-emerald-300/50">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      );
    case "aktiv":
      return (
        <div className="w-7 h-7 rounded-full bg-fjord-500 flex items-center justify-center steg-aktiv-puls shadow-md shadow-fjord-400/50">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      );
    case "feil":
      return (
        <div className="w-7 h-7 rounded-full bg-danger flex items-center justify-center steg-feil-shake shadow-md shadow-red-300/50">
          <X className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      );
    default:
      return (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
          <Circle className="w-3.5 h-3.5 text-gray-400" />
        </div>
      );
  }
}

export function Fremdriftslinje({ steg, prosent }: Props) {
  return (
    <div className="w-full space-y-4">
      {/* Percentage display */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-fjord-500 uppercase tracking-wide">
          Fremdrift
        </span>
        <span className="text-lg font-bold text-fjord-600 tabular-nums fremdrift-prosent-enter">
          {Math.round(prosent)}%
        </span>
      </div>

      {/* Progress bar — thicker with gradient and glow dot */}
      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="fremdrift-bar h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${prosent}%` }}
        />
        {/* Glowing leading edge dot */}
        {prosent > 0 && prosent < 100 && (
          <div
            className="fremdrift-glow-dot"
            style={{ left: `${prosent}%` }}
          />
        )}
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {steg.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-3 py-2 px-2 rounded-lg transition-all duration-300",
              s.status === "venter" && "opacity-40",
              s.status === "aktiv" && "bg-fjord-50/70",
              s.status === "ferdig" && "bg-emerald-50/40",
              s.status === "feil" && "bg-red-50/40"
            )}
          >
            <StegIkon status={s.status} />
            <span
              className={cn(
                "text-sm",
                s.status === "aktiv" && "font-bold text-fjord-700",
                s.status === "ferdig" && "text-gray-500 line-through decoration-emerald-400/50",
                s.status === "feil" && "text-danger font-medium",
                s.status === "venter" && "text-gray-400"
              )}
            >
              {s.navn}
            </span>
            {s.feilmelding && (
              <span className="text-xs text-danger font-medium ml-auto">{s.feilmelding}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
