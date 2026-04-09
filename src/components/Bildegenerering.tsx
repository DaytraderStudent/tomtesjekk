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

  // Determine which building types are suitable based on arealformål + BYA + height
  const formaalStr = (typeof arealformaal === "string" ? arealformaal : "").toLowerCase();

  interface Bygningsforslag {
    type: string;
    passer: boolean;
    begrunnelse: string;
  }

  const forslag: Bygningsforslag[] = [
    {
      type: "Enebolig",
      passer:
        formaalStr.includes("bolig") ||
        formaalStr.includes("frittliggende") ||
        formaalStr.includes("småhus") ||
        formaalStr.includes("bebyggelse og anlegg"),
      begrunnelse:
        maksBebygget && maksBebygget >= 80
          ? `Plass til enebolig på inntil ${Math.round(maksBebygget)} m² fotavtrykk.`
          : tomteareal && tomteareal >= 300
            ? "Tomtestørrelsen tilsier plass til enebolig."
            : "Kan være trangt — vurder utnyttelsesgrad.",
    },
    {
      type: "Tomannsbolig",
      passer:
        (formaalStr.includes("bolig") || formaalStr.includes("småhus") || formaalStr.includes("konsentrert")) &&
        (tomteareal ? tomteareal >= 500 : true) &&
        (maksEtasjer ? maksEtasjer >= 2 : true),
      begrunnelse:
        tomteareal && tomteareal >= 500
          ? `${Math.round(tomteareal)} m² tomt gir rom for tomannsbolig med to separate enheter.`
          : "Krever typisk minst 500 m² tomt.",
    },
    {
      type: "Rekkehus",
      passer:
        (formaalStr.includes("bolig") || formaalStr.includes("konsentrert") || formaalStr.includes("småhus")) &&
        (tomteareal ? tomteareal >= 800 : true),
      begrunnelse:
        tomteareal && tomteareal >= 800
          ? `${Math.round(tomteareal)} m² kan gi plass til 3-4 rekkehusenheter.`
          : "Krever typisk minst 800 m² tomt for 3+ enheter.",
    },
    {
      type: "Leilighetsbygg",
      passer:
        (formaalStr.includes("blokk") || formaalStr.includes("konsentrert") || formaalStr.includes("sentrum")) &&
        (maksEtasjer ? maksEtasjer >= 3 : false),
      begrunnelse:
        maksEtasjer
          ? `Tillatt med inntil ${maksEtasjer} etasjer — muliggjør leilighetsbygg.`
          : "Krever typisk regulering til blokkbebyggelse og minst 3 etasjer.",
    },
    {
      type: "Næringsbygg",
      passer:
        formaalStr.includes("næring") ||
        formaalStr.includes("sentrum") ||
        formaalStr.includes("tjenesteyting") ||
        formaalStr.includes("forretning"),
      begrunnelse: formaalStr.includes("næring")
        ? "Arealformålet tillater næringsvirksomhet."
        : formaalStr.includes("sentrum")
          ? "Sentrumsformål åpner for kombinert bolig/næring."
          : "Ikke primært regulert for næring — dispensasjon kan være nødvendig.",
    },
    {
      type: "Hytte / fritidsbolig",
      passer:
        formaalStr.includes("fritid") ||
        formaalStr.includes("turistform") ||
        formaalStr.includes("hytte"),
      begrunnelse: formaalStr.includes("fritid")
        ? "Regulert for fritidsbebyggelse."
        : "Ikke regulert for fritidsformål.",
    },
  ];

  const aktuelle = forslag.filter((f) => f.passer);
  const ikkeAktuelle = forslag.filter((f) => !f.passer);

  // Build other info lines
  const muligheter: Array<{ tittel: string; tekst: string }> = [];

  if (maksBYA && tomteareal && maksBebygget) {
    muligheter.push({
      tittel: "Maks fotavtrykk",
      tekst: `${Math.round(maksBebygget)} m² (BYA ${maksBYA}% av ${Math.round(tomteareal)} m²).${kilde === "tek17" ? " TEK17-referanse." : ""}`,
    });
  }

  if (maksHoyde || maksEtasjer) {
    const deler = [];
    if (maksEtasjer) deler.push(`${maksEtasjer} etasjer`);
    if (maksHoyde) deler.push(`${maksHoyde} m`);
    muligheter.push({
      tittel: "Høyde",
      tekst: `Maks ${deler.join(", ")}.${kilde === "tek17" ? " TEK17-referanse." : ""}`,
    });
  }

  if (grunnforhold) {
    const grunn = grunnforhold.toLowerCase();
    if (grunn.includes("leire") || grunn.includes("marin") || grunn.includes("torv") || grunn.includes("myr")) {
      muligheter.push({
        tittel: "Grunn",
        tekst: `${grunnforhold} — kan kreve peling. Innhent geoteknisk vurdering.`,
      });
    } else if (grunn.includes("fjell") || grunn.includes("morene")) {
      muligheter.push({
        tittel: "Grunn",
        tekst: `${grunnforhold} — normalt gode byggeforhold.`,
      });
    }
  }

  if (regKort?.status === "rod" || (regKort?.statusTekst || "").toLowerCase().includes("uregulert")) {
    muligheter.push({
      tittel: "Obs",
      tekst: "Uregulert område — bygging krever reguleringsprosess. Kontakt kommunen.",
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

      {/* Building type suggestions */}
      {aktuelle.length > 0 && (
        <div className="px-6 lg:px-8 py-5 border-b border-paper-edge">
          <span className="label-editorial block mb-3">Aktuelle bygningstyper</span>
          <div className="space-y-3">
            {aktuelle.map((f) => (
              <div key={f.type} className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-data-green mt-1.5 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-ink">{f.type}</span>
                  <p className="text-sm text-ink-muted mt-0.5">{f.begrunnelse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ikkeAktuelle.length > 0 && (
        <div className="px-6 lg:px-8 py-5 border-b border-paper-edge">
          <span className="label-editorial block mb-3">Sannsynligvis ikke aktuelt</span>
          <div className="space-y-2">
            {ikkeAktuelle.map((f) => (
              <div key={f.type} className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-data-gray mt-1.5 shrink-0" />
                <div>
                  <span className="text-sm text-ink-muted">{f.type}</span>
                  <span className="text-sm text-ink-faint ml-2">— {f.begrunnelse}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory details */}
      {muligheter.length > 0 && (
        <div className="divide-y divide-paper-edge">
          {muligheter.map((m, i) => (
            <div key={i} className="px-6 lg:px-8 py-4 flex gap-4">
              <span className="label-editorial shrink-0 w-28 pt-0.5">{m.tittel}</span>
              <p className="text-sm text-ink-soft leading-relaxed">{m.tekst}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
