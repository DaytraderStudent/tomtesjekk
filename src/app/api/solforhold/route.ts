import { NextRequest, NextResponse } from "next/server";
import SunCalc from "suncalc";
import type { SolforholdResultat } from "@/types";

function formatTid(date: Date): string {
  return date.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

function radTilGrader(rad: number): number {
  return Math.round((rad * 180) / Math.PI * 10) / 10;
}

function beregnSolhoyde(dato: Date, time: number, lat: number, lon: number): number {
  const d = new Date(dato);
  d.setHours(time, 0, 0, 0);
  const pos = SunCalc.getPosition(d, lat, lon);
  return radTilGrader(pos.altitude);
}

function azimuthTilRetning(azimuthRad: number): string {
  // SunCalc azimuth: 0 = south, negative = east, positive = west
  // Convert to compass degrees: 0 = north
  let deg = (azimuthRad * 180) / Math.PI + 180;
  deg = ((deg % 360) + 360) % 360;

  const retninger = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];
  const idx = Math.round(deg / 45) % 8;
  return retninger[idx];
}

function beregnHovedretning(dato: Date, lat: number, lon: number): string {
  // Average azimuth between 09:00 and 15:00
  let sumAzimuth = 0;
  let count = 0;
  for (let h = 9; h <= 15; h++) {
    const d = new Date(dato);
    d.setHours(h, 0, 0, 0);
    const pos = SunCalc.getPosition(d, lat, lon);
    if (pos.altitude > 0) {
      sumAzimuth += pos.azimuth;
      count++;
    }
  }
  if (count === 0) return "—";
  return azimuthTilRetning(sumAzimuth / count);
}

function beregnSesong(dato: Date, lat: number, lon: number) {
  const tider = SunCalc.getTimes(dato, lat, lon);
  const sunrise = tider.sunrise;
  const sunset = tider.sunset;

  const solhoyde12 = beregnSolhoyde(dato, 12, lat, lon);

  // Handle polar cases: SunCalc returns NaN for sunrise/sunset
  // when sun never rises (polar night) or never sets (midnight sun)
  const sunriseValid = sunrise instanceof Date && !isNaN(sunrise.getTime());
  const sunsetValid = sunset instanceof Date && !isNaN(sunset.getTime());

  if (!sunriseValid || !sunsetValid) {
    // Midnight sun: noon altitude > 0 → 24h daylight
    // Polar night: noon altitude <= 0 → 0h daylight
    const erMidnattssol = solhoyde12 > 0;
    return {
      soloppgang: erMidnattssol ? "Midnattssol" : "Solen står ikke opp",
      solnedgang: erMidnattssol ? "Midnattssol" : "Solen står ikke opp",
      daglengdeTimer: erMidnattssol ? 24 : 0,
      solhoyde09: beregnSolhoyde(dato, 9, lat, lon),
      solhoyde12,
      solhoyde15: beregnSolhoyde(dato, 15, lat, lon),
    };
  }

  const daglengdeMs = sunset.getTime() - sunrise.getTime();
  const daglengdeTimer = Math.round((daglengdeMs / (1000 * 60 * 60)) * 10) / 10;

  return {
    soloppgang: formatTid(sunrise),
    solnedgang: formatTid(sunset),
    daglengdeTimer: Math.max(0, daglengdeTimer),
    solhoyde09: beregnSolhoyde(dato, 9, lat, lon),
    solhoyde12,
    solhoyde15: beregnSolhoyde(dato, 15, lat, lon),
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
    const aar = new Date().getFullYear();
    const sommersolverv = new Date(aar, 5, 21, 12, 0, 0); // June 21
    const vintersolverv = new Date(aar, 11, 21, 12, 0, 0); // December 21

    const sommer = beregnSesong(sommersolverv, lat, lon);
    const vinter = beregnSesong(vintersolverv, lat, lon);
    const hovedretning = beregnHovedretning(sommersolverv, lat, lon);

    const resultat: SolforholdResultat = {
      sommer,
      vinter,
      hovedretning,
    };

    return NextResponse.json(resultat);
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke beregne solforhold" },
      { status: 500 }
    );
  }
}
