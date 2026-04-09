"use client";

import type { Rapport } from "@/types";

interface Props {
  rapport: Rapport;
}

export function Bildegenerering({ rapport }: Props) {
  const regKort = rapport.kort.find((k) => k.id === "regulering");
  const eiendomKort = rapport.kort.find((k) => k.id === "eiendom");
  const grunnKort = rapport.kort.find((k) => k.id === "grunn");
  const regData = regKort?.raadata;

  const maksEtasjer = regData?.maksEtasjer;
  const maksHoyde = regData?.maksHoyde;
  const maksBYA = regData?.utnyttingsgrad;
  const tomteareal = eiendomKort?.raadata?.arealKvm;
  const maksBebygget = regData?.maksBebyggetAreal;
  const arealformaal = regKort?.raadata?.arealformaal || regKort?.beskrivelse || null;
  const kilde = regData?.utnyttelseKilde;
  const grunnforhold = grunnKort?.beskrivelse;

  // Don't show if no useful data
  if (!regKort && !eiendomKort) return null;

  // Build concise lines about what can be built
  const muligheter: Array<{ tittel: string; tekst: string }> = [];

  if (arealformaal) {
    muligheter.push({
      tittel: "Arealformål",
      tekst: typeof arealformaal === "string" ? arealformaal : String(arealformaal),
    });
  }

  if (maksBYA && tomteareal && maksBebygget) {
    muligheter.push({
      tittel: "Bebygd areal",
      tekst: `Inntil ${Math.round(maksBebygget)} m² fotavtrykk (BYA ${maksBYA}% av ${Math.round(tomteareal)} m² tomt).${kilde === "tek17" ? " Basert på TEK17-referanse — sjekk faktisk reguleringsplan." : ""}`,
    });
  } else if (tomteareal) {
    muligheter.push({
      tittel: "Tomteareal",
      tekst: `${Math.round(tomteareal)} m². Tillatt utnyttelse er ikke kartlagt — kontakt kommunen for gjeldende BYA.`,
    });
  }

  if (maksHoyde || maksEtasjer) {
    const deler = [];
    if (maksEtasjer) deler.push(`${maksEtasjer} etasjer`);
    if (maksHoyde) deler.push(`${maksHoyde} m gesimshøyde`);
    muligheter.push({
      tittel: "Høyde og volum",
      tekst: `Maks ${deler.join(", ")}.${kilde === "tek17" ? " Veiledende TEK17-referanse." : ""}`,
    });
  }

  if (grunnforhold) {
    const grunn = grunnforhold.toLowerCase();
    if (grunn.includes("leire") || grunn.includes("marin") || grunn.includes("torv") || grunn.includes("myr")) {
      muligheter.push({
        tittel: "Fundamentering",
        tekst: `${grunnforhold} — kan kreve peling eller masseutskifting. Innhent geoteknisk vurdering før prosjektering.`,
      });
    } else if (grunn.includes("fjell") || grunn.includes("morene")) {
      muligheter.push({
        tittel: "Fundamentering",
        tekst: `${grunnforhold} — normalt gode byggeforhold. Standardfundament er sannsynligvis tilstrekkelig.`,
      });
    }
  }

  if (regKort?.status === "rod" || (regKort?.statusTekst || "").toLowerCase().includes("uregulert")) {
    muligheter.push({
      tittel: "Obs: uregulert",
      tekst: "Området har ingen gjeldende reguleringsplan. Bygging krever sannsynligvis en reguleringsprosess — kontakt kommunen tidlig.",
    });
  }

  if (muligheter.length === 0) return null;

  return (
    <section className="bg-paper-soft border border-paper-edge fade-up">
      <div className="border-b border-paper-edge px-6 lg:px-8 py-4">
        <span className="label-editorial">Byggemuligheter</span>
        <h3 className="font-display text-xl text-ink tracking-tight mt-1">
          Hva kan bygges på denne tomten?
        </h3>
      </div>

      <div className="divide-y divide-paper-edge">
        {muligheter.map((m, i) => (
          <div key={i} className="px-6 lg:px-8 py-4 flex gap-4">
            <span className="label-editorial shrink-0 w-28 pt-0.5">{m.tittel}</span>
            <p className="text-sm text-ink-soft leading-relaxed">{m.tekst}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
