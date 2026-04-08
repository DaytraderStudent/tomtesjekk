"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-40 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — ink button with subtle lift
        primary:
          "bg-ink text-paper hover:bg-ink-soft active:scale-[0.98] shadow-editorial hover:shadow-editorial-lg",
        // Clay — warm accent for key CTAs
        clay:
          "bg-clay-500 text-paper hover:bg-clay-600 active:scale-[0.98] shadow-editorial hover:shadow-editorial-lg",
        // Outline — subtle editorial button
        outline:
          "border border-ink/15 bg-paper-soft text-ink hover:bg-paper-deep hover:border-ink/30",
        // Ghost — minimal, for secondary actions
        ghost:
          "text-ink-soft hover:bg-paper-deep hover:text-ink",
        // Link — pure link treatment
        link:
          "text-ink underline-offset-4 hover:underline decoration-ink/30",
      },
      size: {
        sm: "h-9 px-4 text-[13px] rounded-editorial",
        md: "h-11 px-6 text-sm rounded-editorial",
        lg: "h-12 px-8 text-[15px] rounded-editorial tracking-tight",
        xl: "h-14 px-10 text-base rounded-editorial tracking-tight",
        icon: "h-10 w-10 rounded-editorial",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
