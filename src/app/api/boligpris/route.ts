import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { BoligprisResultat } from "@/types";

export async function GET(request: NextRequest) {
  const kommunenummer = request.nextUrl.searchParams.get("kommunenummer");

  if (!kommunenummer) {
    return NextResponse.json(
      { error: "Mangler kommunenummer" },
      { status: 400 }
    );
  }

  try {
    const resultat = await hentPriser(kommunenummer);
    if (resultat) return NextResponse.json(resultat);

    // Fallback: hele landet ("0")
    const fallback = await hentPriser("0");
    if (fallback) {
      fallback.detaljer = `Prisdata ikke tilgjengelig for kommunen. Viser landsgjennomsnitt: ${fallback.detaljer}`;
      return NextResponse.json(fallback);
    }

    return NextResponse.json({
      kommunenavn: "",
      aar: "",
      enebolig: null,
      smahus: null,
      blokk: null,
      detaljer: "Boligprisdata er ikke tilgjengelig.",
    } as BoligprisResultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot SSB boligpristjeneste" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Feil ved oppslag mot SSB boligpriser" },
      { status: 500 }
    );
  }
}

async function hentPriser(region: string): Promise<BoligprisResultat | null> {
  const body = {
    query: [
      { code: "Region", selection: { filter: "item", values: [region] } },
      { code: "Boligtype", selection: { filter: "item", values: ["01", "02", "03"] } },
      { code: "ContentsCode", selection: { filter: "item", values: ["KvPris"] } },
      { code: "Tid", selection: { filter: "top", values: ["1"] } },
    ],
    response: { format: "json" },
  };

  const response = await fetchWithTimeout(
    API_URLS.boligpris,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    15000 // SSB can be slow
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data?.data || data.data.length === 0) return null;

  const boligtypeNavn: Record<string, string> = {
    "01": "enebolig",
    "02": "smahus",
    "03": "blokk",
  };

  const boligtypeLabel: Record<string, string> = {
    "01": "eneboliger",
    "02": "småhus",
    "03": "blokkleiligheter",
  };

  let aar = "";
  const priser: Record<string, number | null> = { enebolig: null, smahus: null, blokk: null };

  for (const row of data.data) {
    // key: [region, boligtype, year], values: ["32000"] or ["."]
    const boligtypeKode = row.key[1];
    const verdi = row.values[0];
    aar = row.key[2] || aar;

    const felt = boligtypeNavn[boligtypeKode];
    if (felt && verdi !== "." && verdi !== "") {
      priser[felt] = parseInt(verdi, 10);
    }
  }

  if (priser.enebolig === null && priser.smahus === null && priser.blokk === null) {
    return null;
  }

  // Build details text
  const deler: string[] = [];
  for (const [kode, felt] of Object.entries(boligtypeNavn)) {
    const pris = priser[felt];
    if (pris !== null) {
      deler.push(`${boligtypeLabel[kode]}: ${pris.toLocaleString("nb-NO")} kr/m²`);
    }
  }

  return {
    kommunenavn: region === "0" ? "Hele landet" : "",
    aar,
    enebolig: priser.enebolig,
    smahus: priser.smahus,
    blokk: priser.blokk,
    detaljer: `Gjennomsnittlig kvadratmeterpris (${aar}): ${deler.join(", ")}. Kilde: SSB tabell 06035.`,
  } as BoligprisResultat;
}
