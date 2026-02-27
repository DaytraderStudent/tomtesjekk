"use client";

import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <Toaster position="bottom-right" richColors />
    </ErrorBoundary>
  );
}
