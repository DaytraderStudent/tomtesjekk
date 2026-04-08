"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  ornamented?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ornamented = false, ...props }, ref) => {
    if (ornamented) {
      return (
        <div
          ref={ref}
          className={cn("rule-editorial", className)}
          {...props}
        />
      );
    }
    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 bg-paper-edge",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = "Separator";

export { Separator };
