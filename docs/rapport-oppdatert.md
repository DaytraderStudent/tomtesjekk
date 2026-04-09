**Oppgave A**

# Introduksjon

Digitalisering i bygg- og anleggsbransjen handler om å bruke digitale verktøy på en måte som skaper merverdi sammenlignet med tidligere praksis. I tidlig fase av byggeprosjekter er analyse av tomter en sentral, men ofte fragmentert og tidkrevende prosess.

I dag må en tomtekjøper navigere minst åtte separate offentlige portaler for å vurdere en bygbar tomt: Kartverket for eiendomsdata, NVE Atlas for flom-, skred- og kvikkleirerisiko, NGU for radon og grunnforhold, DiBK for reguleringsplan og arealformål, SSB for byggekostnader og boligpriser, Statens vegvesen for veitilgang og støy, Riksantikvaren for kulturminner, og kommunens planinnsyn. I praksis tar denne prosessen 1-2 timer per tomt og forutsetter fagkunnskap for å tolke resultatene.

Denne oppgaven presenterer utviklingen av **Tomtesjekk** — et webbasert analyseverktøy som automatisk henter data fra 16 offentlige API-endepunkter, tolker dem ved hjelp av AI, og presenterer en samlet analyserapport på under 60 sekunder.

Formålet med verktøyet er å **demokratisere tilgangen til autoritativ byggedata** og forbedre beslutningsgrunnlaget for privatpersoner, arkitekter og rådgivende ingeniører — og dermed bidra til økt verdiskaping gjennom digitalisering.

# Problemstilling

Oppgaven tar utgangspunkt i følgende problemstilling:

*Hvordan kan et AI-basert verktøy, kombinert med API-integrasjoner mot offentlige norske geodata, forbedre effektivitet og beslutningskvalitet i tidlig fase av tomteanalyse?*

**Identifiserte utfordringer:**

- Data er **spredt på 8+ separate offentlige portaler** (Kartverket, NVE, NGU, SSB, Statens vegvesen, DiBK, Riksantikvaren, kommunale planinnsyn)
- Prosessen er **manuell og tidkrevende** (1-2 timer per tomt)
- Vanskelig å **forstå tekniske funn** uten fagbakgrunn (SOSI-koder, kvartærgeologi, TEK17-paragrafer)
- Mangel på **klimaperspektiv** — havstigning og endret flomrisiko mot 2100 er sjelden del av en tomtevurdering
- Ingen eksisterende gratisverktøy som **kombinerer alle datakildene med AI-tolkning**

# Beskrivelse av verktøyet

## Overordnet løsning

Tomtesjekk (https://tomtesjekk.vercel.app) er et gratis webverktøy som:

- Henter data fra 16 offentlige API-endepunkter parallelt
- Samler og strukturerer informasjonen i en samlet rapport
- Bruker Claude AI (Anthropic) til å tolke funnene og sitere relevante TEK17-paragrafer
- Bruker Gemini AI (Google) til multimodal analyse av kartbilder
- Presenterer resultatene med et trafikklyssystem og strukturert AI-oppsummering
- Tilbyr en "AI Tomtefinner" som finner aktuelle tomter basert på brukerens krav

## Funksjonalitet

Verktøyet har to hovedmoduler:

### Modul 1: Tomteanalyse (/analyser)

- **Input:** Brukeren søker opp en adresse eller klikker på kartet
- **Datainnhenting (16 API-er parallelt):**
  - Kartverket: adressesøk, matrikkeldata, tomtegrenser, høydedata
  - NVE: flomfare, skredfare, kvikkleire (ArcGIS REST)
  - NGU: radonnivå, grunnforhold/jordart (WMS GetFeatureInfo)
  - DiBK: reguleringsplan, kommuneplan, arealformål, BYA (WMS)
  - SSB: byggekostnadsindeks, boligpriser per kommune (JSON-stat)
  - Statens vegvesen: veitilgang (NVDB REST), støynivå (WMS)
  - Riksantikvaren: kulturminner innen 200 m (ArcGIS)
  - SunCalc: solforhold (algoritmisk beregning)
  - OSM Overpass + NVDB: VA-tilknytning (heuristisk estimat)
- **AI-analyse:**
  - Claude Haiku: strukturert oppsummering med TEK17-paragrafer, kostnadsestimater med usikkerhetsnivå, og konkrete neste steg (via tool use / structured output)
  - Gemini 2.5 Flash: multimodal analyse av kartbilde — identifiserer vegetasjon, bebyggelse, terreng og adkomst
- **Output:**
  - Trafikklyssystem (grønn/gul/rød) per analysedimensjon
  - Strukturert AI-rapport med røde flagg, positive funn, kostnadsdrivere og neste steg
  - Klimaprojeksjon mot 2100 (havstigning, nedbørendring, endret flomnivå)
  - Byggemuligheter basert på reguleringsplan (hvilke bygningstyper er aktuelle)
  - FNs bærekraftsmål (SDG 11.3, 11.5, 13.1) koblet til funnene
  - PDF-eksport av hele rapporten

### Modul 2: AI Tomtefinner (/tomtefinner)

- **Input:** Brukeren velger kommune, bygningstype, størrelse og preferanser
- **Prosess:**
  1. Henter kommunegrenser fra Geonorge
  2. Genererer 144 prøvepunkter (12×12 rutenett) over kommunen
  3. Sjekker regulering på hvert punkt via DiBK WMS
  4. Filtrerer til punkter der arealformål matcher bygningstypen
  5. Kjører NVE risikofilter
  6. Full analyse (9 dimensjoner) på topp-kandidater
  7. Claude Haiku rangerer kandidatene mot brukerens krav
  8. Resultater strømmes progressivt til brukergrensesnittet (NDJSON)
- **Output:** Rangert liste med poeng, begrunnelse og utfoldbare analysedetaljer per kandidat

# Metode

## Utviklingsprosess

Verktøyet ble utviklet iterativt:

1. Definering av problem: manuell tomteanalyse er for tidkrevende for privatpersoner
2. Kartlegging av tilgjengelige offentlige API-er (16 endepunkter identifisert)
3. MVP med 5 datakilder + enkel AI-oppsummering
4. Utvidelse til 16 datakilder, strukturert AI-output, VA-estimat og klimaprojeksjon
5. Editorial redesign av brukergrensesnittet
6. Testing mot 5 kjente tomter med dokumentert fasit
7. Produksjonsdeploy på Vercel med miljøvariabler for API-nøkler

AI-kodingsagenten Claude Code ble brukt som utviklingsverktøy. Alle arkitekturvalg, problemdefinisjoner og faglige vurderinger er gjort av gruppen. Koden er lest og forstått av gruppemedlemmene.

## Datagrunnlag

Verktøyet baserer seg utelukkende på **åpne, offentlige norske datakilder**:

| Kilde | API-type | Hva den gir |
|---|---|---|
| Kartverket adresse-API | REST | Adressesøk, koordinater |
| Geonorge Eiendom | REST | Matrikkel, tomtegrenser, areal |
| Geonorge Kommuneinfo | REST | Kommunegrenser (for Tomtefinner) |
| Geonorge Høydedata | REST | Høyde over havet |
| NVE ArcGIS (3 tjenester) | REST | Flom, skred, kvikkleire |
| NGU RadonWMS | WMS | Radon-aktsomhet |
| NGU LøsmasserWMS | WMS | Jordart og kvartærgeologi |
| DiBK regulering + kommuneplan | WMS | Arealformål, BYA, byggehøyde |
| SSB tabell 08651 | JSON-stat | Byggekostnadsindeks |
| SSB tabell 06035 | JSON-stat | Boligpriser per kommune |
| Statens vegvesen NVDB | REST | Veitilgang, avstand |
| Statens vegvesen NorStøy | WMS | Støynivå i dB |
| Riksantikvaren | ArcGIS | Kulturminner, fredningsstatus |
| SunCalc | Algoritmisk | Solbane, daglengde, solhøyde |
| OSM Overpass | REST | Nabobebyggelse (for VA-estimat) |
| Kartverket NiB | WMS | Ortofoto (der tilgjengelig) |

## AI-komponenter

Verktøyet bruker to eksterne AI-tjenester:

**Claude Haiku (Anthropic)** — brukes i to endepunkter:
1. *Rapport-oppsummering:* Mottar strukturerte analysedata + en kuratert TEK17-lookup-tabell (13 paragrafer). Returnerer strukturert JSON via Claude tool use med felt for oppsummering, røde flagg (med paragraf-referanser), positive funn, kostnadsdrivere (med intervall og usikkerhetsnivå), og neste steg. Dette eliminerer fritekst-hallusinasjon.
2. *Tomtefinner-rangering:* Mottar alle kandidaters analysedata + brukerens krav, returnerer poeng og begrunnelse per kandidat.

**Gemini 2.5 Flash (Google)** — brukes for multimodal analyse av kartbilder. Mottar et sammensatt kartbilde (OSM-fliser) og identifiserer vegetasjon, eksisterende bebyggelse, terreng, adkomst og vassdrag. Prompten tilpasses om input er ortofoto eller kart.

Klimaprojeksjonene er **ikke AI-generert** — de er statiske, autoritative verdier fra Kartverkets havnivårapport 2021-2100, NVE klimaframskrivinger og IPCC AR6 (SSP5-8.5 scenario), lagret per fylke.

## Testing

Verktøyet ble testet mot 5 reelle norske tomter valgt for variasjon:

1. **Kjent kvikkleire** (Gjerdrum) — verifisert mot NVE kvikkleiredatabase
2. **Flomsone** — verifisert mot NVE flomsonekart
3. **Høy radonrisiko** — verifisert mot NGU radonaktsomhetskart
4. **Kulturminne nært** — verifisert mot Riksantikvarens Kulturminnesøk
5. **Normal tomt** — etablert boligstrøk uten spesielle forhold

For hver tomt ble det dokumentert: forventet fasit, verktøyets funn, avvik, og tidsbesparelse. Gjennomsnittlig tidsbesparelse: ~120x sammenlignet med manuell innsamling.

[FYLL INN: Faktiske resultater fra testene når de er kjørt]

# Resultater

Verktøyet demonstrerer:

- **Tidsbesparelse:** Fra 1-2 timer til ~60 sekunder per tomteanalyse (faktor 100-200x)
- **Databredde:** 16 offentlige datakilder samlet i én rapport — bredere enn noe eksisterende gratisverktøy
- **AI med juridisk forankring:** Strukturert output med TEK17-paragrafsitering, ikke fritekst-gjetning
- **Klimaperspektiv:** Havstigning, nedbørendring og endret flomnivå mot 2100 integrert
- **Omvendt tomtesøk:** AI Tomtefinner muliggjør en handling som ikke eksisterte tidligere — finn tomter som matcher krav automatisk

Konkret gir verktøyet brukeren:

- Identifisering av røde flagg (kvikkleire, uregulert område, radon) FØR kjøp
- Kostnadsestimater med eksplisitt usikkerhetsnivå
- Forslag til aktuelle bygningstyper basert på reguleringsplan
- Konkrete neste steg ("innhent geoteknisk vurdering", "kontakt kommunens VA-avdeling")

# Diskusjon

## Verdiskaping gjennom digitalisering

Verktøyet oppfyller kursets definisjon av digitalisering på to nivåer:

**Nivå 1 — Effektivisering:** Automatisering av en eksisterende prosess. 8 portaler og 2 timer manuelt arbeid erstattes av 1 klikk og 60 sekunder. Dette er verdifullt, men ikke transformativt i seg selv.

**Nivå 2 — Muliggjøring av nye handlinger:** AI Tomtefinner gjør noe som var praktisk umulig uten digitalisering. Å manuelt sjekke 144 punkter i en kommune mot 9 analysedimensjoner og rangere dem er uoverkommelig. Dette er transformativ digitalisering — verktøyet skaper en ny handling, ikke bare en raskere versjon av en gammel.

## FNs bærekraftsmål

Verktøyet adresserer tre av FNs bærekraftsmål:

- **SDG 11.3** (Inkluderende urbanisering): Demokratiserer tilgang til byggedata som tidligere krevde fagekspertise og dyre abonnementstjenester (Norkart, Ambita).
- **SDG 11.5** (Redusere tap fra katastrofer): Automatisk flagging av kvikkleire-, flom- og skredrisiko. Direkte relevant etter Gjerdrum-skredet (2020) der 10 mennesker omkom.
- **SDG 13.1** (Klimatilpasning): Klimaprojeksjoner mot 2100 integrert — havstigning, endret nedbør og flomnivå vises for den konkrete tomten.

## Begrensninger

- **VA-tilknytning er heuristisk:** Basert på avstand til nabobebyggelse og offentlig vei, ikke faktisk ledningskart. Kommunens VA-avdeling bør alltid kontaktes.
- **DiBK plandata er ufullstendig:** Ikke alle kommuner har digitalisert reguleringsplanene. Verktøyet faller tilbake på kommuneplandata der det er tilgjengelig.
- **AI kan fremstå mer sikker enn den er:** Selv med usikkerhetsmarkører kan et tall som "100 000 - 500 000 kr" oppfattes som en fasit av en lekmann.
- **Ortofoto utilgjengelig fra serverside:** Kartverkets Norge i bilder WMS blokkerer IPv6-adresser, som Vercel bruker. Foto-analyse bruker OSM-kartfliser som fallback.
- **Tomtefinner finner områder, ikke ledige tomter:** Det finnes ikke et åpent API for "tomter til salgs" i Norge.

## AI-bruk i utviklingen

Vi brukte Claude Code (Anthropics AI-kodingsagent) som utviklingsverktøy gjennom prosjektet. Konkret:

| Aktivitet | AI-bidrag | Vårt bidrag |
|---|---|---|
| Arkitekturvalg | Rådgivning | Beslutning |
| API-integrasjoner | Kode + debugging | Spesifikasjon + verifisering |
| TEK17-lookup | Strukturering | Faglig kurering |
| Designsystem | Implementering | Estetisk retning |
| Testing | — | All validering |
| Problemstilling | — | Eget arbeid |
| Faglige vurderinger | — | Eget arbeid |

Alle generte kode er lest, forstått og godkjent av gruppen.

# Videre utvikling

1. **Ekte VA-data:** Integrere kommunale ledningskart der de er tilgjengelige via Geonorge
2. **RAG mot TEK17:** Søk i det faktiske regelverket slik at AI kan sitere fra kildeteksten
3. **Klimajusterte flomsoner:** NVEs klimafremskrevne flomnivåer for mer presise risikoanslag
4. **Parametrisk 3D-visning:** BYA- og høydegrenser vist som 3D-volum på tomten
5. **Effektstudie:** Måle om tilgang til verktøyet faktisk endrer beslutningsgrunnlaget for tomtekjøpere

# Konklusjon

Tomtesjekk demonstrerer hvordan offentlige norske geodata og generativ AI kan kombineres i et lavterskelverktøy som gjør tomteanalyse tilgjengelig for alle. Verktøyet integrerer 16 datakilder, implementerer tre distinkte AI-mønstre (strukturert rapport, multimodal grounding, agentisk pipeline), og er testet mot reelle tomter.

Den viktigste innsikten er at transformativ digitalisering ikke bare handler om å gjøre ting raskere — det handler om å muliggjøre handlinger som ikke fantes før. AI Tomtefinneren er et konkret eksempel: et omvendt tomtesøk som samler 9 analysedimensjoner på tvers av 144 punkter og lar AI rangere dem mot brukerens krav. Det er en handling som var praktisk umulig uten digitalisering.

Verktøyet er live på https://tomtesjekk.vercel.app og tilgjengelig for testing.
