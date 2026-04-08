"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-paper-edge">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Brand — typographic mark, no icon */}
          <Link href="/" className="group flex items-baseline gap-3">
            <span className="font-display text-2xl tracking-tight text-ink font-medium">
              Tomtesjekk
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted translate-y-[-2px]">
              Volum 01
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/"
              className="text-[13px] font-mono uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
            >
              Hjem
            </Link>
            <Link
              href="/tomtefinner"
              className="text-[13px] font-mono uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
            >
              AI-tomtefinner
            </Link>
            <Button asChild variant="primary" size="sm">
              <Link href="/analyser">Analyser tomt</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-ink hover:text-clay-500 transition-colors"
            aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-paper-edge py-5 flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-sm font-mono uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
            >
              Hjem
            </Link>
            <Link
              href="/tomtefinner"
              onClick={() => setIsOpen(false)}
              className="text-sm font-mono uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
            >
              AI-tomtefinner
            </Link>
            <Button asChild variant="primary" size="md" className="self-start">
              <Link href="/analyser" onClick={() => setIsOpen(false)}>
                Analyser tomt
              </Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
