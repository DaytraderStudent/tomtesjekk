import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wider border",
  {
    variants: {
      variant: {
        default: "border-paper-edge bg-paper-soft text-ink-muted",
        ink: "border-ink bg-ink text-paper",
        clay: "border-clay-500 bg-clay-500/10 text-clay-700",
        moss: "border-moss-500 bg-moss-500/10 text-moss-700",
        green: "border-data-green/40 bg-data-green/10 text-data-green",
        amber: "border-data-amber/40 bg-data-amber/10 text-[#8B6220]",
        red: "border-data-red/40 bg-data-red/10 text-data-red",
        outline: "border-ink/20 bg-transparent text-ink-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
