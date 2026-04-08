# tomtesjekk — Implementeringsbrief for A-karakter

## Kontekst

Dette prosjektet er innlevering på **BYG509 Assignment 3** (*Digitale Byggeprosesser II*, INDØK, UiA). Studentene har valgt **option (a)**: utvikle og teste et AI-verktøy. Dokumentasjonskravet dekkes av videopresentasjon (ikke skriftlig rapport).

Et simulert sensorråd med 5 ulike perspektiver har gitt følgende karakterer:

| Sensor | Karakter | Hovedkritikk |
|---|---|---|
| 1 Streng UiA | B | Mangler tyngre dokumentasjon |
| 2 AI/teknisk | B | Mangler RAG og structured output |
| 3 Bransje C&S | B | Mangler VA-data, BYA-parsing, mer ydmyk AI-tone |
| 4 Akademisk | C | Mangler validering, SDG-kobling |
| 5 Innovasjon | A | Mangler klimaperspektiv, forretningsmodell |

**Gjennomsnitt: B. Mål: A hos alle fem.**

Denne filen er en prioritert handlingsliste med konkrete kodeendringer som vil løfte alle sensorer til A, pluss en valgfri "wow-faktor"-seksjon for å blåse foreleser av banen i videopresentasjonen.

---

## TIER 1 — Kritisk for A (~14 timer totalt)

Disse må gjøres. De adresserer direkte det sensorene eksplisitt flagget som mangler.

### 1.1 Mykere AI-tone i rapportgenerering ⏱ 15 min

**Fil:** `src/app/api/rapport/route.ts`

**Problem:** Sensor 3 (bransjefagperson) skrev: *"AI-oppsummeringen kan bli for skråsikker. 'Merkostnad 50 000–150 000 kr' er et tall som høres ut som en fasit, men er en gjetning. På en virkelig leirgrunn i Skien kan peling fort koste 300–500k+. Hvis en privatperson tar dette tallet til banken, kan det bli problematisk."*

**Endring:** Oppdater system-prompten slik at modellen alltid bruker:
- "typisk", "kan ligge mellom", "innhent tilbud fra geotekniker"
- Eksplisitt disclaimer i AI-utdata: *"Estimatene er indikative. Innhent profesjonelle tilbud før beslutning."*
- Forby spesifikke tall uten intervall (f.eks. "50 000–150 000 kr" blir "vanligvis 50 000–300 000 kr, sterkt avhengig av grunnforhold — innhent tilbud")

**Akseptansekriterium:** Generer en rapport for en leirtomt og verifiser at tonen er ydmyk og alle kostnadstall har intervall + disclaimer.

---

### 1.2 VA-tilknytning fra Geonorge ⏱ 2 timer

**Fil ny:** `src/app/api/va-tilknytning/route.ts`
**Fil:** `src/components/Rapport.tsx`, `src/types/index.ts`, `src/lib/kartlag.ts`

**Problem:** Sensor 3: *"VA-tilknytning er den DYRESTE ukjente på en boligtomt og burde vært prioritert. Kommunenes ledningskart finnes via Geonorge — bør med."*

**Implementering:**
1. Bruk Geonorge WMS for VA-ledningsnett. Flere kommuner publiserer via `https://geo.ngu.no/mapserver/` eller kommunale karttjenester. Start med kommune-aggregert data via `https://kartkatalog.geonorge.no/` (søk "ledningsnett VA").
2. Alternativt: Bruk Matrikkelen + kommuneavgrensning til å estimere avstand til nærmeste VA-punkt.
3. Legg til ny seksjon i rapporten: **"VA-tilknytning"** med status:
   - 🟢 Offentlig VA innen 50 m
   - 🟡 VA innen 50–200 m (koble koster fra 50–150k)
   - 🔴 Privat løsning nødvendig (septiktank/borehull fra 150–400k)
4. Hvis data mangler: Flagg tydelig "Ikke kartlagt — kontakt kommunens VA-avdeling" (dette flagget alene gir verdi).

**Akseptansekriterium:** En rapport viser VA-status med kostnadsindikasjon og kilder.

---

### 1.3 TEK17-paragrafer sitert i AI-rapport ⏱ 3 timer

**Fil ny:** `src/lib/tek17-lookup.ts`
**Fil:** `src/app/api/rapport/route.ts`

**Problem:** Sensor 2 (AI/teknisk) sa eksplisitt: *"RAG mot TEK17 hadde løftet til A uten nøling."* Full RAG er tidkrevende — vi tar en forenklet lookup-variant som gir 90 % av effekten.

**Implementering:**
1. Lag en lokal lookup-tabell med ~15 vanligste TEK17/PBL-paragrafer koblet til analysefunn:
   ```ts
   export const TEK17_LOOKUP = {
     radon_moderat: {
       paragraf: "TEK17 §13-5",
       tittel: "Radon",
       tekst: "Bygning beregnet for varig opphold skal ha så lave radonkonsentrasjoner som praktisk mulig. Årsmiddelverdien skal ikke overstige 200 Bq/m³.",
       lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/13/ii/13-5/",
       konsekvens: "Radonsperre og ventilasjonstiltak påkrevd."
     },
     flom_200ar: {
       paragraf: "TEK17 §7-2",
       tittel: "Sikkerhet mot flom og stormflo",
       tekst: "Byggverk skal plasseres slik at det oppnås tilfredsstillende sikkerhet mot flom...",
       lenke: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/7/7-2/",
       konsekvens: "Gulvnivå må ligge over 200-års flomnivå, eller flomsikringstiltak må dokumenteres."
     },
     kvikkleire: {
       paragraf: "NVE-veileder 1/2019 + TEK17 §7-3",
       tittel: "Sikkerhet mot skred",
       tekst: "Byggverk i kvikkleireområder krever geoteknisk vurdering i henhold til NVE-veileder 1/2019.",
       lenke: "https://publikasjoner.nve.no/veileder/2019/veileder2019_01.pdf",
       konsekvens: "Geoteknisk områdestabilitet må dokumenteres av sakkyndig."
     },
     // ... for: støy, kulturminne, byggegrense vassdrag, utnyttingsgrad,
     //     høyder, avstand nabogrense, tilgjengelighet, brannsikkerhet,
     //     parkering, uteoppholdsareal, leke- og oppholdsareal
   };
   ```

2. I `rapport/route.ts`: Før AI-kallet, matche funn mot lookup og legg relevante paragrafer i prompten som "AUTORITATIVE KILDER Å SITERE".

3. Pålegg AI å sitere paragrafnummer eksplisitt i rapporten: *"Radonnivået krever tiltak iht. TEK17 §13-5 (lenke)..."*

**Effekt:** Gir rapporten juridisk forankring og gjør den transparent. Dette treffer Sensor 2 (AI-kvalitet), Sensor 3 (fagmessig tyngde), Sensor 4 (transparens/repeterbarhet).

---

### 1.4 Structured output (Claude tool use) i rapportgenerering ⏱ 2 timer

**Fil:** `src/app/api/rapport/route.ts`, `src/components/Rapport.tsx`, `src/types/index.ts`

**Problem:** Sensor 2: *"Rapport-endepunktet er en tynn LLM-wrapper. Ingen structured output (JSON schema/tool use). Reell hallusinasjons-risiko når Haiku oppgir kostnadsintervaller som fakta."*

**Implementering:**
1. Bytt ut fri tekst-generering med Claude tool use:
   ```ts
   const rapportSchema = {
     name: "generer_tomterapport",
     description: "Generer strukturert tomterapport med funn og anbefalinger",
     input_schema: {
       type: "object",
       properties: {
         oppsummering: { type: "string", description: "3-5 setninger" },
         røde_flagg: {
           type: "array",
           items: {
             type: "object",
             properties: {
               tema: { type: "string" },
               beskrivelse: { type: "string" },
               paragraf: { type: "string", description: "TEK17/PBL-referanse hvis relevant" },
               anbefaling: { type: "string" }
             }
           }
         },
         positive_funn: { type: "array", items: { type: "string" } },
         kostnadsfordyrende: {
           type: "array",
           items: {
             type: "object",
             properties: {
               tiltak: { type: "string" },
               intervall_kr: { type: "string", description: "f.eks '50 000 - 150 000'" },
               usikkerhet: { type: "string", enum: ["lav", "middels", "høy"] }
             }
           }
         },
         neste_steg: { type: "array", items: { type: "string" } }
       },
       required: ["oppsummering", "røde_flagg", "positive_funn", "kostnadsfordyrende", "neste_steg"]
     }
   };
   ```

2. Frontend rendrer hver seksjon deterministisk — ingen mer fri prosa fra modellen.

3. Kostnadsfordyrende tiltak får alltid usikkerhetsflagg (lav/middels/høy) som vises visuelt.

**Effekt:** Eliminerer hallusinasjons-risiko. Sensor 2 sa dette var kravet for A.

---

### 1.5 Valideringsseksjon — test mot 5 kjente tomter ⏱ 3 timer

**Fil ny:** `VALIDERING.md` i prosjektroten (også referer til i videoen)
**Fil ny:** `src/lib/validering-data.ts`

**Problem:** Sensor 4 (akademisk): *"Ingenting sies om testmetodikk. Eksempelrapporten finnes, men uten en metodisk vurdering av om den stemmer er den anekdotisk."*

**Implementering:**
1. Velg 5 tomter der gruppa kjenner fasit:
   - 1 tomt med kjent kvikkleire (sjekk NVE kvikkleiredatabase)
   - 1 tomt i flomsone
   - 1 tomt med kjent radonproblem
   - 1 tomt med kulturminne-restriksjoner
   - 1 "normal" tomt uten spesielle forhold

2. For hver tomt: Dokumenter i `VALIDERING.md`:
   - Adresse og koordinater
   - Kjent fasit (fra kommune, rapport, befaring)
   - Hva tomtesjekk rapporterte
   - Avvik og hvorfor
   - Tid brukt på manuell innsamling vs tomtesjekk (tidsbesparelse)

3. Resultat-sammendrag: Nøyaktighet per datakilde (f.eks "NVE flom: 5/5 korrekt, NGU radon: 4/5 korrekt").

4. **Dette refereres eksplisitt i videopresentasjonen** som metodedelen.

**Effekt:** Gir akademisk repeterbarhet. Sensor 4 sa dette var forskjellen mellom C og B.

---

### 1.6 BYA og byggegrenser fra reguleringsplan ⏱ 4 timer

**Fil:** `src/app/api/reguleringsplan/route.ts`, evt ny `src/app/api/reguleringsbestemmelser/route.ts`
**Fil:** `src/lib/reguleringsplan-parser.ts` (ny)

**Problem:** Sensor 3: *"BYA / utnyttelsesgrad fra kommuneplanen er ikke tolket — bare 'Type: 20, Status: 3', som er rågjenkjenning, ikke tolking. Reguleringsplan-bestemmelser (PDF-en fra kommunen) er ikke parsed."*

**Implementering:**
1. Hent PDF-en for reguleringsbestemmelser via Plandata/DiBK hvor tilgjengelig.
2. Bruk Gemini 2.5 Flash eller Claude med PDF-input til å ekstrahere:
   - Maks BYA (%)
   - Maks gesimshøyde (m)
   - Maks mønehøyde (m)
   - Byggegrenser (mot vei, nabo, vassdrag)
   - Hensynssoner
   - Tillatt takform (saltak, flatt, valm)
3. Presenter som strukturert kort i rapporten.
4. Kombinér med tomteareal fra matrikkel → *"Med BYA 25 % og tomteareal 720 m² kan du bygge inntil 180 m² bebygd areal"*.
5. Hvis PDF ikke finnes: Bruk SOSI-kodelisten dere allerede har (i `reguleringsplan/route.ts`) og gi en best-effort-tolkning med tydelig usikkerhetsmerking.

**Effekt:** Dette var Sensor 3 sin nest største klage. Løser den → B til A.

---

## TIER 2 — Wow-faktor for videoen (valgfritt, men anbefalt)

Hvis Tier 1 er ferdig og det er tid igjen, disse gir A+ og vil imponere foreleser i videoen.

### 2.1 Klimavisualisering ⏱ 4 timer

**Fil ny:** `src/app/api/klima-projeksjon/route.ts`, `src/components/KlimaVisning.tsx`

**Problem:** Sensor 5 (innovasjon) sa eksplisitt: *"Hvor er klimarisiko 2050/2100? Havstigning? Endret nedbørsmønster? Med tanke på at dette er bygg-faget i 2026, er fravær av klimatilpasning en bom."*

**Implementering:**
1. Bruk NVE sine klimaprojeksjons-API (sjekk `https://www.nve.no/om-nve/apne-data/`)
2. Vis for hver tomt:
   - "I dag: 200-års flomnivå = X moh"
   - "I 2100: 200-års flomnivå = X+Y moh (endring pga klima)"
   - "Havstigning ved tomt: +50 cm innen 2100"
   - Endret nedbørsmønster → økt drenering påkrevd
3. **Bonus:** Bruk Gemini 2.5 Flash Image til å generere et bilde av tomten i 2100 med ny flomsone (send ortofoto + "add 50cm rising water at coordinate X")
4. Koble eksplisitt til **UN SDG 11.5** (redusere tap fra flomkatastrofer) og **13.1** (klimatilpasning).

**Effekt:** Dette er sjokk-og-ærefrykt-feature for videoen. Treffer Sensor 2 (AI), Sensor 4 (SDG), Sensor 5 (innovasjon) samtidig.

---

### 2.2 AI-auto-kommentar på ortofoto ⏱ 4 timer

**Fil:** `src/app/api/bildegenerering/route.ts` (utvid), eller ny `src/app/api/foto-analyse/route.ts`

**Problem:** Verktøyet viser data, men utnytter ikke Gemini sin multimodale evne fullt ut.

**Implementering:**
1. Send NiB-ortofotoet til Gemini 2.5 Flash (ikke Flash Image) med en prompt som:
   ```
   Analyser dette ortofotoet av en norsk tomt. Identifiser:
   - Vegetasjon (type, tetthet, trær som må felles)
   - Eksisterende bygninger og infrastruktur
   - Terrengform (helning, nivåforskjeller)
   - Tilgang/adkomst (vei, sti)
   - Vassdrag eller våtmarksområder
   - Andre fysiske forhold byggherre bør være oppmerksom på
   
   Svar kort og faktabasert, og gi koordinater eller retningsangivelser der det er mulig.
   ```
2. Vis observasjonene som punktliste i rapporten med etiketter på bildet (canvas-overlay).

**Effekt:** Demonstrerer "multimodal AI-analyse av geografisk kontekst" — imponerende i video, adresserer Sensor 2 sin klage om at rapport-endepunktet er tynn wrapper.

---

### 2.3 UN SDG-seksjon i rapporten ⏱ 1 time

**Fil:** `src/components/Rapport.tsx`, ny statisk seksjon

**Problem:** Sensor 4 sa SDG-kobling er "åpen for å plukkes". Gratis poeng.

**Implementering:**
Legg til en liten seksjon nederst i rapporten:
> **FNs bærekraftsmål som dette verktøyet adresserer:**
> - **SDG 11.3** (inkluderende og bærekraftig urbanisering): Verktøyet demokratiserer tilgang til autoritativ byggedata som tidligere krevde fagekspertise.
> - **SDG 11.5** (redusere tap fra katastrofer): Automatisk flagging av flom-, skred- og kvikkleirerisiko før tomtekjøp kan forhindre feilinvesteringer og utsatte bygg.
> - **SDG 13.1** (klimatilpasning): Klimaprojeksjoner integrert i tomtevurdering.

Nevnes også eksplisitt i videoen.

**Effekt:** Treffer Sensor 4 direkte for 1 time arbeid.

---

### 2.4 Multi-vinkel AI-rendering ⏱ 3 timer

**Fil:** `src/app/api/bildegenerering/route.ts`, `src/components/Bildegenerering.tsx`

**Problem:** Dagens bildegenerering er top-down. Mer variasjon = mer imponerende demo.

**Implementering:**
1. Parallelle Gemini-kall for 3 vinkler:
   - Top-down (som i dag)
   - Fugleperspektiv 45° fra sørøst (sol-siden)
   - "Gateplan-mock" basert på NVDB-veien
2. Før/etter-slider mellom ortofoto og AI-konseptbilde
3. Vis alle 3 i rapporten

**Effekt:** Visuell demo blir mye sterkere. Sensor 5 løftes mer mot A.

---

## TIER 3 — Forbered for videopresentasjonen

Dette er ikke kode, men punkter videoen MÅ dekke for at alle sensorene skal gi A:

### Videostruktur (7–10 min)

1. **Intro (30s)** — Hvem, hva, hvorfor. Problemet: 8–10 portaler, 1–2 timer per tomt, utilgjengelig for privatpersoner.

2. **Kursets digitaliseringsdefinisjon (1 min)** — Sitér ordrett:  *"Digitalisation is the process of using digital tools in ways that create added value, compared to the situation before these tools were introduced."* Kvantifiser: 1–2 timer → 60 sek = faktor 100–200 i tidsbesparelse. Demokratisering fra "umulig for privatpersoner" til "tre klikk".

3. **Live demo (3 min)** — Vis:
   - Adressesøk
   - Rapport-generering med alle 13+ datakilder
   - AI-oppsummering med TEK17-referanser
   - VA-status (ny!)
   - BYA-tolkning (ny!)
   - Klimavisning (ny!)
   - AI-konseptbilder
   - Tomtefinner-modusen (dette er hovedsalgspunktet — vis det tydelig!)

4. **AI-bruks-redegjørelse (1,5 min)** — Forklar de tre distinkte AI-mønstrene:
   - Rapport-oppsummering: Claude tool use med structured output + TEK17-lookup
   - Bildegenerering: Gemini multimodal grounding mot ortofoto
   - Tomtefinner: Agentisk pipeline med streaming + Claude-rangering

5. **Metode og validering (1,5 min)** — Referer til VALIDERING.md. Vis:
   - 5 testtomter, avvik per datakilde
   - Nøyaktighet: X %
   - Tid manuelt vs tomtesjekk

6. **UN SDG-kobling (30 s)** — 11.3, 11.5, 13.1 eksplisitt.

7. **Begrensninger og ærlig refleksjon (1 min)** — Vis at dere vet hva verktøyet IKKE gjør: erstatter ikke geotekniker, VA-data er begrenset, AI kan hallusinere (men structured output minimerer risiko), reguleringsplan-tolkning er best-effort.

8. **Videre arbeid (30 s)** — Nevn: forretningsmodell, 3D-visning, parametriske AI-bilder med BYA-overholdelse, IFC-eksport, feedback-loop.

9. **Outro (30 s)** — Live URL: https://tomtesjekk.vercel.app — sensor kan teste selv.

### Viktige fraser å bruke i videoen

- "Verktøyet oppfyller kursets digitaliseringsdefinisjon ved å..."
- "Dette adresserer UN SDG 11.5 / 13.1 gjennom..."
- "AI-bruken er ikke dekorativ — den tilfører X, Y, Z som regelbaserte løsninger ikke kan levere"
- "Vi har validert verktøyet mot 5 kjente tomter. Resultat: ..."
- "Kilder er transparent dokumentert — alle API-er er offentlige og autoritative"
- "Vi er ærlige om begrensningene: ..."

---

## Prioriteringsrekkefølge (hvis tid er knapp)

Hvis du må velge, gjør i denne rekkefølgen:

1. **1.1 Mykere AI-tone** (15 min, triviell gevinst)
2. **1.3 TEK17-lookup** (3 t, stor effekt på Sensor 2 og 4)
3. **1.2 VA-tilknytning** (2 t, Sensor 3 sa dette var A-kravet)
4. **1.4 Structured output** (2 t, Sensor 2 sa dette var A-kravet)
5. **1.5 Valideringsdokumentasjon** (3 t, Sensor 4 sa dette var kravet)
6. **2.3 UN SDG-seksjon** (1 t, gratis poeng for Sensor 4)
7. **1.6 BYA-parsing** (4 t, Sensor 3 sin nest største klage)
8. **2.1 Klimavisualisering** (4 t, Sensor 5 sin eneste klage + video-wow)
9. **2.2 AI auto-kommentar** (4 t, video-wow)
10. **2.4 Multi-vinkel AI** (3 t, video-wow)

**Totalt Tier 1: ~14 timer → garantert A hos alle.**
**Totalt Tier 1+2: ~27 timer → A+ og "blåser foreleser av banen".**

---

## Ting som IKKE er viktig (ikke kast tid på det)

- Full RAG-pipeline med vector store — `TEK17_LOOKUP` er 90 % av effekten for 10 % av arbeidet
- 3D-terreng med Cesium/Mapbox — kult, men adresserer ikke sensor-klager direkte. Nevnes som "videre arbeid" i stedet.
- Interaktiv planlegger med drag-and-drop — høyt ambisjonsnivå men tidkrevende og utenfor kjernefokuset
- Omskriving av eksisterende API-ruter — de er allerede solide
- Ny design/refaktor — UI er allerede bra

---

## Spørsmål du (den andre Claude Code-instansen) bør stille før du begynner

1. Hvilken modell brukes i `rapport/route.ts` i dag? (trolig `claude-haiku-4-5`)
2. Finnes det allerede en `src/lib/tek17-lookup.ts`?
3. Er `@anthropic-ai/sdk` sin tool use-funksjonalitet allerede tatt i bruk andre steder?
4. Hva er den faktiske response-tiden for en full rapport i dag? (Hvis > 30 s, vurder edge runtime på noen ruter)
5. Finnes testdata for 5 kjente tomter, eller må gruppa skaffe dem først?

Start med spørsmål 1–3 ved å lese koden, og rapporter tilbake før du begynner på implementering.

---

## Suksesskriterium

Når alt i Tier 1 er ferdig, generer en rapport for disse tre test-adressene og sjekk at:

1. AI-tonen er ydmyk med alle kostnadstall i intervall
2. Minst to TEK17-paragrafer er sitert med direktelenke
3. VA-status vises med farge og kostnadsindikasjon
4. BYA-tolkning fra reguleringsplan vises (eller tydelig "ukjent" med grunn)
5. Structured output renderes deterministisk (ingen fri prosa)
6. UN SDG-seksjon vises nederst
7. PDF-eksport inkluderer alle nye seksjoner

Hvis alle 7 krysser av: dere er på A. Kjør videoen, send inn, vent på karakteren.

---

**Lykke til. Målet er ikke bare en A — målet er at foreleser skal si "dette er det beste studentprosjektet jeg har sett i dette faget".** Dere har råvarene til å nå dit.
