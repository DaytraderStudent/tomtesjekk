import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { KartverketAdresse } from "@/types";

export async function GET(request: NextRequest) {
  const sok = request.nextUrl.searchParams.get("sok");

  if (!sok || sok.length < 2) {
    return NextResponse.json({ adresser: [] });
  }

  try {
    const params = new URLSearchParams({
      sok,
      fuzzy: "true",
      treffPerSide: "8",
      asciiKompatibel: "true",
    });

    const response = await fetchWithTimeout(
      `${API_URLS.kartverket}?${params.toString()}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Feil ved oppslag mot Kartverket" },
        { status: 502 }
      );
    }

    const data = await response.json();

    const adresser: KartverketAdresse[] = (data.adresser || []).map(
      (a: any) => ({
        adressetekst: a.adressetekst || "",
        poststed: a.poststed || "",
        postnummer: a.postnummer || "",
        kommunenavn: a.kommunenavn || "",
        kommunenummer: a.kommunenummer || "",
        representasjonspunkt: {
          lat: a.representasjonspunkt?.lat || 0,
          lon: a.representasjonspunkt?.lon || 0,
        },
      })
    );

    return NextResponse.json({ adresser });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd ved oppslag mot Kartverket" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Kunne ikke søke etter adresser" },
      { status: 500 }
    );
  }
}
