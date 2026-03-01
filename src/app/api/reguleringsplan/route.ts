import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout, buildWmsGetFeatureInfoUrl } from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";
import type { ReguleringsplanResultat } from "@/types";

function parsePlanGml(text: string): ReguleringsplanResultat {
  if (
    text.includes("Search returned no results") ||
    (!text.includes("planomraade") &&
      !text.includes("Planomraade") &&
      !text.includes("plannavn") &&
      !text.includes("planNavn"))
  ) {
    return {
      harPlan: false,
      planNavn: null,
      planType: null,
      arealformaal: null,
      planStatus: null,
      planId: null,
      detaljer: "Ingen reguleringsplan funnet for dette punktet",
    };
  }

  // Try various field name patterns used by Geonorge WMS
  const navnMatch =
    text.match(/<(?:plan[Nn]avn|plannavn)>([^<]+)</) ||
    text.match(/<(?:PLANNAVN|planNavn)>([^<]+)</);
  const typeMatch =
    text.match(/<(?:plan[Tt]ype|plantype)>([^<]+)</) ||
    text.match(/<(?:PLANTYPE|planType)>([^<]+)</);
  const formaalMatch =
    text.match(/<(?:arealformaal|arealForm[aå]l|AREALFORMAAL)>([^<]+)</) ||
    text.match(/<(?:formaal|FORMAAL|formål)>([^<]+)</);
  const statusMatch =
    text.match(/<(?:plan[Ss]tatus|planstatus|PLANSTATUS)>([^<]+)</) ||
    text.match(/<(?:planbestemmelse|vedtaksdato)>([^<]+)</);
  const idMatch =
    text.match(/<(?:plan[Ii]d|planid|PLANID|planidentifikasjon)>([^<]+)</) ||
    text.match(/<(?:nasjonalArealplanId|NASJONALAREALPLANID)>([^<]+)</);

  const planNavn = navnMatch ? navnMatch[1].trim() : null;
  const planType = typeMatch ? typeMatch[1].trim() : null;
  const arealformaal = formaalMatch ? formaalMatch[1].trim() : null;
  const planStatus = statusMatch ? statusMatch[1].trim() : null;
  const planId = idMatch ? idMatch[1].trim() : null;

  let detaljer = "";
  if (planNavn) detaljer += `Plan: ${planNavn}`;
  if (planType) detaljer += detaljer ? `. Type: ${planType}` : `Type: ${planType}`;
  if (arealformaal) detaljer += detaljer ? `. Formål: ${arealformaal}` : `Formål: ${arealformaal}`;
  if (planStatus) detaljer += detaljer ? `. Status: ${planStatus}` : `Status: ${planStatus}`;

  return {
    harPlan: true,
    planNavn,
    planType,
    arealformaal,
    planStatus,
    planId,
    detaljer: detaljer || "Reguleringsplan funnet",
  };
}

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
    // Try detail/area regulation plans first
    const url = buildWmsGetFeatureInfoUrl(
      API_URLS.planomraade,
      "Omraderegulering,Detaljregulering",
      lat,
      lon
    );

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return NextResponse.json({
        harPlan: false,
        planNavn: null,
        planType: null,
        arealformaal: null,
        planStatus: null,
        planId: null,
        detaljer: "Kunne ikke hente plandata",
      } as ReguleringsplanResultat);
    }

    const text = await response.text();
    let resultat = parsePlanGml(text);

    // Fallback: try municipal plan if no detail/area plan found
    if (!resultat.harPlan) {
      try {
        const fallbackUrl = buildWmsGetFeatureInfoUrl(
          API_URLS.planomraade,
          "Kommune-_og_kommunedelplan",
          lat,
          lon
        );
        const fallbackRes = await fetchWithTimeout(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackText = await fallbackRes.text();
          resultat = parsePlanGml(fallbackText);
        }
      } catch {
        // Ignore fallback errors
      }
    }

    return NextResponse.json(resultat);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Tidsavbrudd mot Geonorge Plandata" },
        { status: 504 }
      );
    }
    return NextResponse.json({
      harPlan: false,
      planNavn: null,
      planType: null,
      arealformaal: null,
      planStatus: null,
      planId: null,
      detaljer: "Feil ved oppslag mot Geonorge",
    } as ReguleringsplanResultat);
  }
}
