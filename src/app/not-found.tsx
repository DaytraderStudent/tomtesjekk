import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main className="min-h-[60vh] flex items-center justify-center bg-surface px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-fjord-50 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-fjord-400" />
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">
            404
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Denne siden finnes ikke. Kanskje du leter etter en tomt i stedet?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Til forsiden
            </Link>
            <Link
              href="/analyser"
              className="px-6 py-3 bg-fjord-500 text-white rounded-xl hover:bg-fjord-600 transition-colors font-medium"
            >
              Analyser en tomt
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
