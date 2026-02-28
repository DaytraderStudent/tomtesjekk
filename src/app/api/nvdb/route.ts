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
    });

    const response = await fetchWithTimeout(
      `${API_URLS.nvdb}?${params.toString()}`,
      {
        headers: {
          Accept: "application/vnd.vegvesen.nvdb-v3-rev1+json",
          "User-Agent": "Mozilla/5.0 (compatible; Tomtesjekk/1.0; +https://tomtesjekk.vercel.app)",
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

    // Response can be an array — pick the first (nearest) result
    const hit = Array.isArray(data) ? data[0] : data;

    if (!hit) {
      return NextResponse.json({
        vegkategori: "Ukjent",
        vegstatus: "Ukjent",
        vegreferanse: "Ingen vei funnet",
        avstand: 200,
        detaljer: "Ingen offentlig vei funnet i nærheten",
      } as NvdbResultat);
    }

    const vegkategori =
      hit.vegsystemreferanse?.vegsystem?.vegkategori || "Ukjent";
    const vegstatus =
      hit.vegsystemreferanse?.vegsystem?.fase || "Ukjent";
    const avstand = hit.avstand || 0;
    const vegreferanse =
      hit.vegsystemreferanse?.kortform || `${vegkategori}-vei`;

    const vegkategoriNavn: Record<string, string> = {
      E: "Europavei",
      R: "Riksvei",
      F: "Fylkesvei",
      K: "Kommunal vei",
      P: "Privat vei",
      S: "Skogsbilvei",
    };

    const vegkontekst: Record<string, string> = {
      E: "Europavei med god standard og offentlig vedlikehold.",
      R: "Riksvei med offentlig vedlikehold og god fremkommelighet.",
      F: "Fylkesvei med offentlig vedlikehold.",
      K: "Kommunal vei med offentlig vedlikehold og brøyting.",
      P: "Privat vei — eier/beboere har ansvar for vedlikehold, brøyting og kostnadsdeling. Avklar rettigheter og avtaler med veilaget før kjøp.",
      S: "Skogsbilvei — begrenset standard og vedlikehold. Kan ha begrensninger for helårs bruk og tungtrafikk.",
    };

    const resultat: NvdbResultat = {
      vegkategori,
      vegstatus,
      vegreferanse,
      avstand,
      detaljer: `Nærmeste vei: ${vegreferanse} (${Math.round(avstand)}m). Type: ${vegkategoriNavn[vegkategori] || vegkategori}. ${vegkontekst[vegkategori] || ""}`,
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
