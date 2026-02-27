import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { SsbResultat } from "@/types";

export async function GET() {
  try {
    // SSB table 08651: Building cost index for residential buildings
    const query = {
      query: [
        {
          code: "Bygningstype",
          selection: {
            filter: "item",
            values: ["00"], // All building types
          },
        },
      ],
      response: {
        format: "json-stat2",
      },
    };

    const response = await fetchWithTimeout(API_URLS.ssb, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Feil ved oppslag mot SSB" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Parse json-stat2 format
    const values = data.value || [];
    const tidDimension = data.dimension?.Tid || data.dimension?.tid;
    const tidKategorier = tidDimension?.category?.index
      ? Object.keys(tidDimension.category.index)
      : [];

    if (values.length === 0 || tidKategorier.length === 0) {
      return NextResponse.json({
        indeksverdi: 0,
        periode: "Ukjent",
        endringProsent: 0,
        detaljer: "Ingen data tilgjengelig fra SSB",
      } as SsbResultat);
    }

    // Get the latest value and the one before it
    const sisteVerdi = values[values.length - 1];
    const nestSisteVerdi = values.length > 1 ? values[values.length - 2] : sisteVerdi;
    const sistePeriode = tidKategorier[tidKategorier.length - 1];

    const endringProsent =
      nestSisteVerdi > 0
        ? ((sisteVerdi - nestSisteVerdi) / nestSisteVerdi) * 100
        : 0;

    const resultat: SsbResultat = {
      indeksverdi: sisteVerdi,
      periode: sistePeriode,
      endringProsent: Math.round(endringProsent * 10) / 10,
      detaljer: `Byggekostnadsindeks: ${sisteVerdi} (${sistePeriode}). Endring: ${endringProsent > 0 ? "+" : ""}${Math.round(endringProsent * 10) / 10}% fra forrige periode.`,
    };

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot SSB" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot SSB" },
      { status: 500 }
    );
  }
}
