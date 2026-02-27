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
        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      );
    case "aktiv":
      return (
        <div className="w-6 h-6 rounded-full bg-fjord-500 flex items-center justify-center animate-progress-pulse">
          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
        </div>
      );
    case "feil":
      return (
        <div className="w-6 h-6 rounded-full bg-danger flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-white" />
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
          <Circle className="w-3 h-3 text-gray-400" />
        </div>
      );
  }
}

export function Fremdriftslinje({ steg, prosent }: Props) {
  return (
    <div className="w-full space-y-4">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-fjord-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${prosent}%` }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {steg.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-3 py-1.5 transition-opacity",
              s.status === "venter" && "opacity-50"
            )}
          >
            <StegIkon status={s.status} />
            <span
              className={cn(
                "text-sm",
                s.status === "aktiv" && "font-medium text-fjord-700",
                s.status === "ferdig" && "text-gray-500",
                s.status === "feil" && "text-danger",
                s.status === "venter" && "text-gray-400"
              )}
            >
              {s.navn}
            </span>
            {s.feilmelding && (
              <span className="text-xs text-danger ml-auto">{s.feilmelding}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
