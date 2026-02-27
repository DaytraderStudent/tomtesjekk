import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { NvdbResultat } from "@/types";

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "0");
  const lon = parseFloat(request.nextUrl.searchParams.get("lon") || "0");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Mangler koordinater (lat, lon)" },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      maks_avstand: "200",
      srid: "4326",
    });

    const response = await fetchWithTimeout(
      `${API_URLS.nvdb}?${params.toString()}`,
      {
        headers: {
          Accept: "application/vnd.vegvesen.nvdb-v3-rev1+json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          vegkategori: "Ukjent",
          vegstatus: "Ukjent",
          vegreferanse: "Ingen vei funnet",
          avstand: 200,
          detaljer: "Ingen offentlig vei funnet innen 200 meter",
        } as NvdbResultat);
      }
      return NextResponse.json(
        { error: "Feil ved oppslag mot NVDB" },
        { status: 502 }
      );
    }

    const data = await response.json();

    const vegkategori = data.vegkategori || data.vegsystemreferanse?.vegsystem?.vegkategori || "Ukjent";
    const vegstatus = data.vegstatus || data.vegsystemreferanse?.vegsystem?.fase || "Ukjent";
    const avstand = data.avstand || 0;
    const vegreferanse =
      data.vegsystemreferanse?.kortform ||
      data.vegreferanse ||
      `${vegkategori}-vei`;

    const resultat: NvdbResultat = {
      vegkategori,
      vegstatus,
      vegreferanse,
      avstand,
      detaljer: `Nærmeste vei: ${vegreferanse} (${Math.round(avstand)}m). Kategori: ${vegkategori}.`,
    };

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot NVDB" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot NVDB" },
      { status: 500 }
    );
  }
}
