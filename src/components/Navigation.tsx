"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-fjord-500 flex items-center justify-center group-hover:bg-fjord-600 transition-colors">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-fjord-500">
              Tomtesjekk
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-fjord-500 transition-colors font-medium"
            >
              Hjem
            </Link>
            <Link
              href="/analyser"
              className="px-5 py-2.5 bg-fjord-500 text-white rounded-lg hover:bg-fjord-600 transition-colors font-medium"
            >
              Analyser tomt
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-fjord-500"
            aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-200",
            isOpen ? "max-h-40 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-fjord-500 transition-colors font-medium"
            >
              Hjem
            </Link>
            <Link
              href="/analyser"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 bg-fjord-500 text-white rounded-lg hover:bg-fjord-600 transition-colors font-medium text-center"
            >
              Analyser tomt
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
