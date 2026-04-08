import Link from "next/link";
import { DISCLAIMER_TEXT, DATAKILDER } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative bg-paper border-t border-paper-edge">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          {/* Brand column */}
          <div className="col-span-12 md:col-span-4">
            <Link href="/" className="group inline-flex items-baseline gap-3">
              <span className="font-display text-3xl tracking-tight text-ink font-medium">
                Tomtesjekk
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted translate-y-[-4px]">
                Volum 01
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm text-ink-soft leading-relaxed">
              En uavhengig sammenstilling av offentlige data for norske
              eiendommer. Bygget som et verktøy for privatpersoner,
              arkitekter og rådgivende ingeniører.
            </p>
            <p className="mt-4 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Gratis · Uavhengig · Åpen kilde
            </p>
          </div>

          {/* Sections */}
          <div className="col-span-6 md:col-span-3 md:col-start-6">
            <h3 className="label-editorial mb-4">Seksjoner</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-ink-soft hover:text-ink transition-colors"
                >
                  Hjem
                </Link>
              </li>
              <li>
                <Link
                  href="/analyser"
                  className="text-sm text-ink-soft hover:text-ink transition-colors"
                >
                  Analyser tomt
                </Link>
              </li>
              <li>
                <Link
                  href="/tomtefinner"
                  className="text-sm text-ink-soft hover:text-ink transition-colors"
                >
                  AI-tomtefinner
                </Link>
              </li>
            </ul>
          </div>

          {/* Data sources */}
          <div className="col-span-6 md:col-span-3">
            <h3 className="label-editorial mb-4">Datakilder</h3>
            <ul className="space-y-3">
              {DATAKILDER.slice(0, 6).map((kilde) => (
                <li key={kilde.navn}>
                  <a
                    href={kilde.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-1"
                  >
                    {kilde.navn}
                    <span className="text-ink-faint text-xs">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer — subdued */}
        <div className="mt-16 pt-8 border-t border-paper-edge grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8">
            <span className="label-editorial block mb-3">Ansvarsfraskrivelse</span>
            <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
              {DISCLAIMER_TEXT}
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 flex md:justify-end md:items-end">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              © {new Date().getFullYear()} Tomtesjekk
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
