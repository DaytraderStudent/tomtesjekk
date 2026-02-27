import { MapPin } from "lucide-react";
import { DISCLAIMER_TEXT, DATAKILDER } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-fjord-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-fjord-500 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Tomtesjekk
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Gratis AI-drevet tomteanalyse for hele Norge.
            </p>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="font-semibold text-white mb-3">Datakilder</h3>
            <ul className="space-y-2">
              {DATAKILDER.map((kilde) => (
                <li key={kilde.navn}>
                  <a
                    href={kilde.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {kilde.navn}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="font-semibold text-white mb-3">Ansvarsfraskrivelse</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {DISCLAIMER_TEXT}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-fjord-700 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Tomtesjekk. Alle rettigheter reservert.
        </div>
      </div>
    </footer>
  );
}
