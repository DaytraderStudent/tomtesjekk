"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KartverketAdresse } from "@/types";

interface Props {
  onVelgAdresse: (adresse: KartverketAdresse) => void;
  disabled?: boolean;
}

export function Adressesok({ onVelgAdresse, disabled }: Props) {
  const [sok, setSok] = useState("");
  const [resultater, setResultater] = useState<KartverketAdresse[]>([]);
  const [erApen, setErApen] = useState(false);
  const [laster, setLaster] = useState(false);
  const [aktivIndex, setAktivIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listeRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setErApen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sokAdresser = useCallback(async (tekst: string) => {
    if (tekst.length < 2) {
      setResultater([]);
      setErApen(false);
      return;
    }

    setLaster(true);
    try {
      const res = await fetch(`/api/adresse?sok=${encodeURIComponent(tekst)}`);
      const data = await res.json();
      setResultater(data.adresser || []);
      setErApen((data.adresser || []).length > 0);
      setAktivIndex(-1);
    } catch {
      setResultater([]);
    } finally {
      setLaster(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sokAdresser(sok), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sok, sokAdresser]);

  const velg = (adresse: KartverketAdresse) => {
    setSok(adresse.adressetekst);
    setErApen(false);
    setResultater([]);
    onVelgAdresse(adresse);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!erApen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setAktivIndex((prev) => Math.min(prev + 1, resultater.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setAktivIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (aktivIndex >= 0 && aktivIndex < resultater.length) {
          velg(resultater[aktivIndex]);
        }
        break;
      case "Escape":
        setErApen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={erApen}
          aria-autocomplete="list"
          aria-controls="adresse-liste"
          aria-label="Søk etter adresse"
          placeholder="Skriv en adresse, f.eks. Storgata 1 Oslo..."
          value={sok}
          onChange={(e) => setSok(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => resultater.length > 0 && setErApen(true)}
          onBlur={() => setTimeout(() => setErApen(false), 200)}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-3.5 rounded-xl border-2 border-gray-200",
            "bg-white text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:border-fjord-500 focus:ring-2 focus:ring-fjord-500/20",
            "transition-all text-base",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {laster && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fjord-500 animate-spin" />
        )}
      </div>

      {erApen && resultater.length > 0 && (
        <ul
          id="adresse-liste"
          ref={listeRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-72 overflow-y-auto"
        >
          {resultater.map((adresse, index) => (
            <li
              key={`${adresse.adressetekst}-${index}`}
              role="option"
              aria-selected={index === aktivIndex}
              onClick={() => velg(adresse)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                index === aktivIndex
                  ? "bg-fjord-50 text-fjord-700"
                  : "hover:bg-gray-50"
              )}
            >
              <MapPin className="w-4 h-4 text-fjord-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  {adresse.adressetekst}
                </div>
                <div className="text-sm text-gray-500">
                  {adresse.postnummer} {adresse.poststed}, {adresse.kommunenavn}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
