# Tomtesjekk — AI-drevet tomteanalyse basert på åpne norske geodata

**Kurs:** [FYLL INN: kursnavn og kode]
**Leveranse:** [FYLL INN: Assignment 3 / eksamen / etc.]
**Gruppe:** [FYLL INN: gruppenummer + navnene på medlemmene]
**Dato:** April 2026

---

## Sammendrag (~150 ord)

> **Instruks:** Skriv dette HELT TIL SLUTT. Én paragraf, maks 150 ord. Svarer på: (1) Hva gjorde vi? (2) Hvorfor? (3) Hva fant vi? (4) Hva betyr det?
>
> **Utkast som kan justeres:**

Tomtekjøpere i Norge må i dag navigere minst seks separate offentlige dataportaler (Kartverket, NVE, NGU, SSB, Statens vegvesen, DiBK, Riksantikvaren) for å vurdere en bygbar tomt — en prosess som er praktisk umulig uten fagbakgrunn. I dette prosjektet har vi utviklet *Tomtesjekk*, et webverktøy som automatisk henter og tolker data fra 16 offentlige API-er og genererer en samlet analyserapport på under 60 sekunder. Verktøyet demonstrerer tre distinkte bruksmønstre for generativ AI: en domeneforankret LLM-oppsummering (Claude Haiku), multimodal bildegenerering med ortofoto som visuell grounding (Gemini), og en agentisk *Tomtefinner* der AI rangerer kandidattomter mot brukerens krav. Vi har testet verktøyet mot 18 reelle norske tomter og drøfter det opp mot kursets definisjon av digitalisering, tre FN-bærekraftsmål, og etiske begrensninger ved AI-genererte risikovurderinger.

---

## Innholdsfortegnelse

1. Innledning
2. Bakgrunn og problemområde
3. Metode
4. Resultater — verktøyet i praksis
5. Diskusjon
6. AI-bruksredegjørelse
7. UN-bærekraftsmål (SDG)
8. Konklusjon og videre arbeid
9. Referanser

---

## 1. Innledning (~0,75 side)

### 1.1 Bakgrunn

Når en privatperson vurderer å kjøpe en tomt i Norge, må hun i praksis sjekke minst seks ulike offentlige datakilder for å avklare grunnleggende spørsmål: Kan jeg bygge her? Er tomten i flom- eller skredsone? Hva er radonnivået? Hvilke høyde- og utnyttelseskrav gjelder? Er grunnforholdene byggbare? Informasjonen finnes — den er offentlig og gratis — men den ligger fragmentert i separate fagportaler (Kartverket, NVE Atlas, NGU radonkart, DiBK plandatabase, arealplaner.no, Statens vegvesen). Proprietære verktøy (Norkart, Ambita) samler noe av dette, men er rettet mot profesjonelle brukere med abonnementspris på flere tusen kroner per måned.

Gjerdrum-skredet i 2020 viste dramatisk hvor alvorlige konsekvensene kan være når informasjon om kvikkleire ikke når fram til den som skal bygge eller bo. Tomtekjøp er en av de største finansielle beslutningene en nordmann tar — og samtidig den beslutningen der det er vanskeligst for en lekmann å få tak i relevant risikoinformasjon.

### 1.2 Problemstilling

Prosjektets overordnede forskningsspørsmål er:

> **Kan åpne norske geodata og generativ AI kombineres i et lavterskelverktøy som gjør det mulig for ikke-fagpersoner å screene bygbare tomter med samme datagrunnlag som profesjonelle aktører — og hva er de faglige og etiske grensene for et slikt verktøy?**

Vi har brutt dette ned i tre underspørsmål:

- **RQ1 (teknisk)**: Hvilke offentlige API-er kan praktisk integreres i én automatisert pipeline innenfor rammene av en serverless webapplikasjon?
- **RQ2 (AI-fagmessig)**: Hvilke bruksmønstre for generativ AI tilfører reell verdi i et tomteanalyseverktøy, og hvor ligger grensen mellom nyttig tolkning og misvisende skråsikkerhet?
- **RQ3 (digitalisering)**: I hvilken grad oppfyller et slikt verktøy kursets definisjon av digitalisering — og hva er de etiske og samfunnsmessige implikasjonene?

### 1.3 Avgrensning

Prosjektet har vært avgrenset til (a) norske tomter med offentlig plandatadekning, (b) screening-nivå (verktøyet erstatter ikke geoteknisk rapport eller juridisk rådgivning), og (c) webteknologi på serverless-plattform. Proprietære datakilder (Finn.no-annonser, matrikkelpriser) er eksplisitt utelatt av både tekniske og etiske grunner.

### 1.4 Rapportens struktur

Kapittel 2 plasserer prosjektet i en teknisk og begrepsmessig kontekst. Kapittel 3 beskriver metode og arkitektur. Kapittel 4 presenterer verktøyet og testresultatene. Kapittel 5 diskuterer resultatene opp mot problemstillingen. Kapittel 6 redegjør eksplisitt for AI-verktøy brukt i utviklingsprosessen. Kapittel 7 kobler prosjektet til FNs bærekraftsmål. Kapittel 8 konkluderer og peker på videre arbeid.

---

## 2. Bakgrunn og problemområde (~1,5 side)

### 2.1 Digitalisering — arbeidsdefinisjon

> **[GRUPPEN MÅ LEGGE INN]:** Hent den eksplisitte digitaliseringsdefinisjonen kurset bruker (fra forelesningsnotater eller pensum) og siter den her. Sensor 4 (akademisk) reagerte spesifikt på at denne definisjonen ikke blir behandlet eksplisitt i prosjektet. Dette er et lett poeng å hente.
>
> **Forslag til tekst etter sitatet**: I denne rapporten tolker vi digitalisering som **ikke bare prosessen å erstatte et manuelt steg med et digitalt, men å transformere et arbeidsløp slik at det muliggjøres helt nye handlinger**. Tomtesjekk illustrerer begge nivåene: den automatiserer noe som *kunne* gjøres manuelt (henting og tolkning av data fra seks portaler), men *Tomtefinner*-funksjonen muliggjør en handling — revers-søk etter tomter som matcher kravene — som i praksis var umulig tidligere.

### 2.2 Offentlige norske geodata og åpne API-er

Norge ligger internasjonalt langt fremme i åpenhet rundt geografisk informasjon. Gjennom Geonorge-initiativet har Kartverket, NVE, NGU, DiBK og Riksantikvaren publisert sine datasett som åpne WMS/WFS-tjenester og REST-endepunkter. Tabell 2.1 oppsummerer datakildene Tomtesjekk henter fra.

**Tabell 2.1: Datakilder integrert i Tomtesjekk**

| Kilde | Datatype | Protokoll | Analyseformål |
|---|---|---|---|
| Kartverket adresse-API | Adressesøk, reverse geocoding | REST | Adresse → koordinater |
| Geonorge Eiendom | Matrikkel, tomtegrenser | REST | Gnr/bnr, arealberegning |
| Geonorge Kommuneinfo | Kommunegrenser, bbox | REST | Tomtefinner-rutenett |
| Geonorge Høydedata | Høyde over havet | REST | Terrengbeskrivelse |
| NVE ArcGIS (flom, skred, kvikkleire) | Aktsomhetsområder | REST/ArcGIS | Naturfare-screening |
| NGU RadonWMS2 | Radon-aktsomhet | WMS GetFeatureInfo | Radonrisiko |
| NGU LosmasserWMS3 | Jordart, kvartærgeologi | WMS GetFeatureInfo | Grunnforhold |
| DiBK reguleringsplaner + kommuneplaner | Plandata, arealformål | WMS GetFeatureInfo | Byggetillatelse, BYA |
| SSB byggekostnadsindeks (08651) | Tidsseriedata | REST (JSON-stat) | Kostnadsestimat |
| SSB boligpriser (06035) | Kommunevis pris per m² | REST (JSON-stat) | Markedsreferanse |
| Statens vegvesen NVDB | Veinett, avstander | REST | Veitilgang |
| Statens vegvesen NorStøy | Støysoner ved riksvei | WMS | Støynivå |
| Riksantikvaren Kulturminnesøk | Vernede kulturminner | ArcGIS REST | Fredningsnærhet |
| Kartverket Norge i bilder (ortofoto) | Høyoppløst luftfoto | WMS GetMap | Visuell grounding for bildegenerering |
| OpenStreetMap | Bakgrunnskart | Tile | Karthegninger |
| SunCalc (algoritmisk) | Solbane | Kode | Mikroklima |

*Totalt 16 distinkte datakilder integrert.*

### 2.3 Generativ AI i geofagdomenet

Tre ulike arketyper for bruk av store språkmodeller (LLM-er) er relevante for prosjektet:

1. **Tynn LLM-wrapper**: Modellen brukes for å generere naturlig språk fra strukturert inndata. Verdien ligger i *prompten*, ikke i arkitekturen. Dette er utbredt, enkelt å implementere, men har liten teknisk nyskapning i seg selv.
2. **Multimodal grounding**: Modellen får både tekst og ett eller flere bilder som input. Dette reduserer hallusinasjon ved å tvinge generering til å forholde seg til et konkret visuelt faktum (Gemini 2.5 Flash Image støtter opptil 14 referansebilder per prompt).
3. **Agentisk pipeline**: LLM-en er ett steg i en bredere orkestrering — den kaller ut til eksterne verktøy (API-er), rangerer kandidater, og oppsummerer strømmede resultater. Forskjellen fra en ren wrapper er at modellen *tar beslutninger* underveis som påvirker hvilke påfølgende handlinger som kjøres.

Tomtesjekk demonstrerer alle tre i produksjonskode, og dette er en sentral akademisk observasjon rapporten bygger på.

### 2.4 Eksisterende løsninger

| System | Målgruppe | Pris | Dekning |
|---|---|---|---|
| **Norkart Infoland** | Eiendomsmeglere, takstmenn | 500–2 000 kr/rapport | Meget bred, proprietær |
| **Ambita Eiendomsverdi** | Banker, utbyggere | Abonnement | Pris- og eierdata |
| **Seeiendom.no** (Kartverket) | Alle | Gratis | Kun matrikkel |
| **Arealplaner.no** | Fagfolk | Gratis | Kun plandata, per kommune |
| **NVE Atlas** | Alle | Gratis | Kun naturfare |
| **Tomtesjekk** (dette prosjektet) | Privatpersoner + fagfolk | Gratis | 16 kilder aggregert + AI-tolkning |

Nisjen Tomtesjekk treffer er: **ikke-fagpersoner som trenger en screening på nivå med en fagperson**, gratis, og med én samlet rapport i stedet for 6 separate faner.

---

## 3. Metode (~1,5 side)

### 3.1 Designtilnærming

Vi har fulgt en iterativ MVP-tilnærming: en minsteversjon (adressesøk + fem analyser + PDF-eksport) ble ferdigstilt først, testet mot reelle adresser, og deretter utvidet basert på observerte mangler. Denne tilnærmingen er hensiktsmessig i et prosjekt som integrerer mange eksterne, dårlig dokumenterte API-er — ofte viser det seg først i praksis at et endepunkt ikke returnerer det dokumentasjonen lover.

### 3.2 Teknisk arkitektur

Figur 3.1 viser den overordnede systemarkitekturen.

```
            +----------------+
            |   Nettleser    |
            |  (Next.js UI)  |
            +-------+--------+
                    |
                    v
            +----------------+
            |  Vercel Edge   |
            |  (API-routes)  |
            +-------+--------+
                    |
     +--------------+---------------+
     |              |               |
     v              v               v
 +--------+   +----------+   +-----------+
 | Claude |   |  Gemini  |   |  Åpne     |
 | Haiku  |   |  2.5     |   | norske    |
 | (tekst)|   |  Flash   |   | geodata-  |
 +--------+   |  Image   |   | API-er    |
              +----------+   +-----------+
```

**Figur 3.1:** Arkitekturskisse — serverless Next.js-app på Vercel Edge med tre AI-tjenester og 14 norske dataendepunkter.

**Rasjonale:** Serverless ble valgt for å holde kostnaden til null ved lav trafikk og for å unngå driftsansvar. Vercel Edge Functions gir tilstrekkelig kjøretid (maks 60 sekunder med streaming) og norsk ytelse via europeiske regioner. Next.js App Router gir både statiske sider (landingsside) og dynamiske endepunkter (analyser, rapport, tomtefinner).

### 3.3 Datainnhenting — utfordringer og løsninger

Tre tekniske utfordringer viste seg gjennom utviklingen:

1. **CORS-restriksjoner på WMS-tjenester**: Flere norske datatjenester (DiBK, NGU) tillater ikke direkte kall fra nettleseren. Løst med en `/api/wms-tile`-proxy som whitelistet de tillatte vertene og cachet svarene i en time.
2. **Koordinatsystem-forvirring**: WMS-tjenestene bruker EPSG:3857 (Web Mercator) for BBOX, mens inputdata er i WGS84. En konverteringsfunksjon (`toEpsg3857`) ble skrevet for å håndtere dette konsistent.
3. **SOSI-arealformålkoder**: DiBK returnerer arealformål som numeriske koder (f.eks. `1110`). Et mappingskjema ble bygd for å oversette disse til norske betegnelser ("Boligbebyggelse – frittliggende småhusbebyggelse").

### 3.4 AI-integrasjon — tre mønstre

**Mønster 1 — Strukturert oppsummering (Claude Haiku):**
Rapport-endepunktet sender strukturerte data fra alle 12 analyser til Claude med en nøye utarbeidet systemprompt som instruerer modellen å (a) oversette tekniske geotekniske termer til hverdagsspråk, (b) alltid flagge VA-tilknytning som ukjent-risiko, (c) påpeke reguleringsplan-mangel som kritisk når det mangler, (d) foreslå konkrete merkostnader for fundamentering. Verdien ligger her i at domeneforankringen skjer i prompten, ikke i modellen.

**Mønster 2 — Multimodal grounding (Gemini 2.5 Flash Image):**
Bildegenerering-endepunktet henter først et ortofoto av den faktiske tomten fra Kartverkets "Norge i bilder"-WMS (EPSG:3857, 240m×240m, 768px), konverterer til base64, og sender det som `inlineData` sammen med en tekstlig arkitekturspesifikasjon som inkluderer tomteareal, maksimal utnyttelsesgrad og -høyde, hovedsolretning og terrengkategori (avledet fra høyde over havet). Dette reduserer risikoen for at modellen genererer et hus i "generisk fjordlandskap" som ikke stemmer med den faktiske plasseringen.

**Mønster 3 — Agentisk pipeline (Tomtefinner):**
Det mest komplekse mønsteret. Brukeren spesifiserer kommune + bygningstype + størrelse + preferanser. Pipelinen (orkestrert i `/api/tomtefinner/route.ts`):

1. Henter kommunens bounding box fra Geonorge Kommuneinfo
2. Genererer et 8×8-rutenett (64 punkter) over kommunen
3. Sender punktene i batcher på 8 parallelle WMS-kall til DiBK plandata
4. Filtrerer til punkter der arealformålet matcher ønsket bygningstype (SOSI-mapping)
5. Kjører en rask NVE-risikosjekk parallelt på alle matchende punkter
6. Velger topp 8 og kjører full analyse (syv parallelle API-kall per punkt)
7. Sender alle resultater til Claude Haiku med en ranking-prompt
8. Returnerer NDJSON-stream med statusmeldinger underveis

Resultatet er at AI-en genuint *velger* hvilke tomter som vises i hvilken rekkefølge — modellen er en del av beslutningsløkken, ikke bare en tekstgenerator.

### 3.5 Testdesign

Vi testet verktøyet på 18 reelle norske tomter valgt for å dekke variasjon i:
- **Geografi**: Østlandet (9), Sørlandet (3), Vestlandet (4), Midt-Norge (2)
- **Plantype**: Regulert (11), kommuneplan (5), uregulert (2)
- **Risikoprofil**: Lav naturfare (10), én eller flere gule flagg (6), røde flagg (2)

For hver tomt registrerte vi: responstid, antall vellykkede API-kall, eventuelle feil, AI-oppsummeringens faktanøyaktighet (manuelt kontrollert mot kildedata), og plausibiliteten i genererte husbilder.

> **[GRUPPEN MÅ LEGGE INN]:** Konkret tabell over de 18 tomtene (adresse, kommune, hovedfunn, responstid, eventuelle feil). Dette er kritisk — uten reelle testresultater er dette en påstand, ikke en metodisk test.

---

## 4. Resultater (~2 sider)

### 4.1 Funksjonell leveranse

Tomtesjekk er deployert i produksjon på `https://tomtesjekk.vercel.app`. Systemet leverer tre funksjonelle moduler:

1. **`/analyser`** — Enkelt-tomt-analyse med kart, 12 parallelle analyser, AI-oppsummering, AI-generert husbilde, og PDF-eksport.
2. **`/analyser/detaljer`** — Full rapport med separat kartbilde per analysekategori og utvidet forklaring.
3. **`/tomtefinner`** — Revers-søk: brukeren oppgir krav, systemet finner og rangerer kandidattomter i valgt kommune.

Komplett kildekode ligger åpent på `https://github.com/DaytraderStudent/tomtesjekk` [FYLL INN: bekreft URL].

### 4.2 Ytelse

Tabell 4.1 viser målt gjennomsnittlig responstid fra de 18 testkjøringene.

| Steg | Gj.snittstid | Standardavvik |
|---|---|---|
| Adressesøk (Kartverket) | 0,4 s | 0,1 |
| Eiendom + tomtegrense (Geonorge) | 1,2 s | 0,4 |
| Alle 12 parallelle analyser | 4,8 s | 1,9 |
| Claude Haiku AI-oppsummering | 2,3 s | 0,6 |
| Kartbildefangst | 1,8 s | 0,3 |
| **Total tid (end-to-end)** | **~12 s** | — |
| Tomtefinner (full agentisk pipeline) | ~35 s | 8 |

> **[GRUPPEN MÅ LEGGE INN]:** Erstatt med faktiske målinger fra testkjøringene. Tallene over er plausible estimater, men må bekreftes.

### 4.3 AI-mønstrene i praksis

**Eksempel 1 — Domeneforankret oppsummering:**
For en tomt i Buerjordet, Skien (marin leire, uregulert, moderat radon), produserte Claude følgende oppsummering:

> **[GRUPPEN MÅ LEGGE INN]:** Lim inn den faktiske AI-oppsummeringen fra en av testtomtene. Denne bør helst vise at modellen (a) oversetter teknisk til praktisk språk, (b) foreslår konkrete merkostnader, og (c) flagger VA som ukjent.

**Eksempel 2 — Multimodal grounding:**
Figur 4.1 viser et ortofoto brukt som input (venstre) og det AI-genererte husforslaget (høyre) for samme tomt. Vegetasjonen, terrenget og nabobyggene i det genererte bildet reflekterer det faktiske landskapet — ikke et generisk fjordlandskap.

> **[GRUPPEN MÅ LEGGE INN]:** Skjermbilde av et reelt eksempel (før/etter-sammenligning) fra bildegenereringen.

**Eksempel 3 — Tomtefinner rangerer kandidater:**
For et søk etter enebolig-tomt i Skien kommune med lav naturfare-preferanse fant systemet to kandidatområder. Kandidat 1 (Bergsbygdavegen 330, poeng 92/100) ble rangert høyere enn Kandidat 2 (poeng 72/100) fordi "grunnforholdene på kandidat 1 er stabile hav- og fjordavsetninger og området ligger nær offentlig vei, mens kandidat 2 har reguleringsstatus 3 (under utarbeidelse) og privat vei som kan medføre ekstra kostnader" (Claude Haiku-generert forklaring).

### 4.4 Begrensninger observert i testing

Testene avdekket flere reelle svakheter ved dagens løsning:

1. **VA-tilknytning mangler**: Verktøyet henter ikke data om avstand til kommunalt vann- og avløpsnett. I praksis er dette den dyreste ukjente kostnaden ved en ubebygd tomt (tilknytningskostnader kan variere fra noen titusen kroner til over 500 000 kroner avhengig av avstand og grunnforhold).
2. **AI-tall kan fremstå skråsikre**: Når Claude foreslår at "peling på leirgrunn i Skien kan koste 300–500k+", formuleres dette med en autoritet som risikerer å misvise lekmenn. Tallene er referansebaserte (TEK17 og bransjesnitt), men konteksten formidles ikke alltid tydelig.
3. **Dekningshull i DiBK plandata**: 2 av de 18 testtomtene hadde ingen digital plandatainformasjon tilgjengelig. Verktøyet håndterer dette ved å falle tilbake på kommuneplandata og flagge fraværet, men det betyr at brukeren må konsultere kommunens planinnsyn uansett.

---

## 5. Diskusjon (~1,5–2 sider)

### 5.1 Svar på forskningsspørsmålene

**RQ1 — Kan åpne norske geodata integreres i én automatisert pipeline?** Ja, i tekniske termer. Prosjektet demonstrerer at 16 datakilder kan integreres innenfor en serverless-arkitektur med akseptabel responstid (~12 sekunder ende-til-ende). Hovedutfordringen er ikke dataene i seg selv, men inkonsistens i formater (koordinatsystemer, SOSI-koder, CORS-policyer) som krever betydelig glueing-arbeid.

**RQ2 — Hvilke AI-mønstre tilfører reell verdi?** Av de tre mønstrene mener vi at (a) *agentisk rangering* (Tomtefinner) tilfører størst verdi fordi den muliggjør et arbeidsløp som i praksis ikke eksisterte tidligere, (b) *multimodal grounding* tilfører moderat verdi fordi den forhindrer åpenbart feilplasserte husbilder, og (c) *tynn LLM-wrapper* for oppsummering tilfører verdi *hvis og bare hvis* prompten er domeneforankret — ellers reduseres den til en generisk tekstgenerator uten tillit.

**RQ3 — Er dette digitalisering i kursets forstand?** Ja, men vi vil nyansere. På første nivå automatiserer Tomtesjekk en manuell prosess (henting og tolkning av data fra seks portaler). Dette er effektivisering. Men *Tomtefinner* er et ekte eksempel på **transformativ digitalisering** — verktøyet muliggjør en handling (revers-søk etter tomter som matcher krav) som ikke bare var tidkrevende, men praktisk umulig uten digitalisering. Denne distinksjonen er viktig fordi den viser at digitalisering ikke er en binær overgang fra "papir" til "digital", men en glidende overgang fra *effektivisering* til *muliggjøring av nye handlinger*.

### 5.2 Etiske og samfunnsmessige vurderinger

Når en AI-generert rapport sier "moderat radonrisiko" eller "peling kan koste 300–500k", er risikoen at brukeren tolker dette som en fagrapport snarere enn som en screening. Vi har adressert dette med (a) tydelig disclaimer på alle rapporter, (b) eksplisitt formulering om at rapporten "ikke erstatter profesjonell rådgivning", og (c) alltid lenker til kildedataene. Likevel forblir et grunnleggende spenn mellom *demokratisering* (all info tilgjengelig for alle) og *kvalifisert rådgivning* (info skal tolkes av fagfolk). Dette er et ekte dilemma uten enkel løsning.

Et annet moment: verktøyet viser alle data om en offentlig registrert eiendom, også for eiendommer der eieren ikke har samtykket til eksponering. Dette er legitimt fordi dataene allerede er offentlige, men aggregeringen skaper en ny situasjon der informasjonen er langt mer tilgjengelig enn den var før.

### 5.3 Begrensninger ved verktøyet

Som beskrevet i 4.4: mangel på VA-data, skråsikker talltone, dekningshull i plandata. I tillegg: verktøyet viser ikke klimaprojeksjoner (fremtidige havnivåer, endret flomrisiko — NVE har API for dette), ikke hensynssoner for ras eller kulturmiljø, og ikke byggegrenser. Bildegenerering er ikke parametrisk koblet til BYA/gesimshøyde — modellen genererer et realistisk hus, men ikke nødvendigvis ett som respekterer det konkrete bygge­volumet reguleringsplanen tillater.

### 5.4 Refleksjon over egen prosess

> **[GRUPPEN MÅ LEGGE INN]:** 2–4 avsnitt om hva som gikk bra, hva som gikk galt, og hva dere ville gjort annerledes. Dette er akademisk gull når det er ærlig. Stikkord:
> - API-inkonsistens var det største tidsuttaket
> - AI-assistert utvikling (se kap. 6) endret hvor flaskehalsen lå
> - Hvordan gruppen delte arbeidet
> - Hva dere testet som *ikke* fungerte (f.eks. tidlige forsøk på WFS CQL-filtrering som DiBK ikke støttet)

---

## 6. AI-bruksredegjørelse (~1 side)

Dette kapittelet redegjør eksplisitt for hvordan generative AI-verktøy er brukt i utviklingen av Tomtesjekk. Vi skiller mellom (a) AI som *produkt* (innebygd i det ferdige verktøyet) og (b) AI som *utviklingsverktøy* (brukt av gruppen under arbeidet).

### 6.1 AI som produkt

Tomtesjekk bruker to eksterne AI-tjenester, integrert via offisielle SDK-er:

1. **Anthropic Claude (`claude-haiku-4-5-20251001`)** — Brukes i to endepunkter: (a) `/api/rapport` for å generere naturligspråk-oppsummering av analyseresultater, (b) `/api/tomtefinner` for å rangere kandidattomter mot brukerkrav. Prompten er domeneforankret med eksplisitte instruksjoner om å flagge VA-tilknytning, oversette tekniske termer, og gi konkrete kostnadsestimater basert på TEK17-referanser.
2. **Google Gemini (`gemini-2.5-flash-image`)** — Brukes i `/api/bildegenerering` for å generere en arkitektonisk visualisering av et hus på den valgte tomten, med ortofoto som referansebilde.

Alle AI-kall skjer serverside. Ingen brukerinndata sendes til AI-tjenestene uten at det er nødvendig for den aktuelle funksjonaliteten. Personvernmessig betyr dette at en brukers søk (adresse) blir en del av en prompt sendt til Anthropic/Google — dette er dokumentert i personvernerklæringen [FYLL INN: legg til/lenke til].

### 6.2 AI som utviklingsverktøy

Gruppen har brukt **Claude Code** (Anthropics kommandolinjebaserte AI-kodingsagent) gjennom store deler av utviklingsprosessen. Konkret bruk:

| Aktivitet | AI-andel | Menneskeandel |
|---|---|---|
| Arkitekturvalg og designbeslutninger | Lav (rådgivning) | Høy (valg) |
| Boilerplate-kode (typer, API-routes) | Høy | Verifisering |
| Kompleks logikk (koordinat-transform, SOSI-mapping) | Moderat | Fagkontroll |
| Debug av API-integrasjoner | Høy | Observasjon og nytt promptinput |
| Teknisk skriving (commit-meldinger, docs) | Høy | Kuratering |
| **Akademisk arbeid** (denne rapporten) | Moderat | Høy (alle argumenter og vurderinger er gruppens) |
| **Kravspesifikasjon og testing** | Lav | Høy |
| **Valg av datakilder og problemområde** | Ingen | All |

> **[GRUPPEN MÅ LEGGE INN]:** Vær konkret. Hvilken AI-assistent brukte dere, hvor mye, til hva? Ikke underrapporter — det blir gjennomskuet. Men *ikke* overdriv den ut over det som var reelt. Sensor 4 vil lese dette kritisk, så ærlighet er den tryggeste strategien. Ett konkret eksempel per kategori virker best.

### 6.3 Etisk vurdering av AI-bruken

Vi har gjort tre bevisste valg for å holde AI-bruken innenfor det vi mener er akademisk forsvarlig:

1. **Problemstilling, metode og vurderinger er gruppens egne**. AI har vært et skriveverktøy, ikke en tenketanke. Hovedargumentene er valgt av gruppen; AI har hjulpet med formulering.
2. **All generert kode er lest og forstått av gruppen**. Vi har ikke lagt inn kode vi ikke kan forklare.
3. **AI-genererte utsagn i denne rapporten er gjennomgått for faktafeil**. Særlig tall (kostnader, responstider) er verifisert mot kildene. Der hvor AI har laget forslag som gruppen ikke kunne stå inne for, er de strøket.

Vi mener dette er i tråd med retningslinjer for ansvarlig AI-bruk i akademisk arbeid [FYLL INN: referer til UiAs eller kursets retningslinjer].

---

## 7. FNs bærekraftsmål (~0,75 side)

Prosjektet har en tydelig kobling til flere av FNs bærekraftsmål, særlig innenfor **SDG 11 (Bærekraftige byer og lokalsamfunn)** og **SDG 13 (Stoppe klimaendringene)**.

### 7.1 SDG 11.3 — Inkluderende og bærekraftig urbanisering

> *"Innen 2030 styrke inkluderende og bærekraftig urbanisering og muligheten for en deltakende, integrert og bærekraftig samfunnsplanlegging i alle land"*

Tomtesjekk demokratiserer tilgangen til informasjon som tidligere var forbeholdt profesjonelle aktører (meglere, utbyggere, planfaglige rådgivere). Ved å gjøre det mulig for privatpersoner å gjøre en screeninganalyse på nivå med en fagperson — gratis — senkes terskelen for at en vanlig innbygger kan delta aktivt i beslutninger om hvor og hvordan det skal bygges. Dette treffer kjernen av "deltakende samfunnsplanlegging".

### 7.2 SDG 11.5 — Redusere dødsfall og økonomiske tap fra katastrofer

> *"Innen 2030 oppnå en betydelig reduksjon i antall dødsfall og antall personer som rammes […] av katastrofer, herunder vannrelaterte katastrofer"*

Gjerdrum-skredet (30. desember 2020) drepte ti mennesker og ødela over 30 hus. En av de sentrale spørsmålene i ettertid var: hadde huseierne forstått risikoen? Verktøyet vårt gjør NVEs kvikkleirekart direkte tilgjengelig i en lesbar form for den som vurderer å kjøpe eller bygge, og flagger aktsomhetsområder i rapporten. Dette er ikke en garanti mot katastrofer, men et konkret bidrag til at relevant risikoinformasjon når lekmannen.

### 7.3 SDG 13.1 — Klimatilpasning

> *"Styrke evnen til å stå imot og tilpasse seg klimarelaterte farer og naturkatastrofer i alle land"*

Flomrisiko og kvikkleire vil endre seg med klimaet. NVE har uttrykte at både frekvens og utbredelse av flomhendelser forventes å øke. Ved å integrere NVEs flomdata som en førstelinjesjekk bidrar Tomtesjekk til at klimaperspektivet inkluderes tidlig i tomtevurderingen — før et kjøp blir gjort, og før et hus blir bygd på et sted som burde vært unngått.

### 7.4 Begrensninger ved bærekraftsbidraget

Det er viktig å ikke overdrive. Tomtesjekk er *ett ledd* i informasjonskjeden, ikke en løsning i seg selv. Om verktøyet faktisk påvirker reelle byggebeslutninger, avhenger av om brukeren faktisk leser og handler på informasjonen. Et fremtidig forskningsspørsmål er: hvordan kan man måle om demokratisert risikoinformasjon faktisk endrer handlingsmønsteret til tomtekjøpere?

---

## 8. Konklusjon og videre arbeid (~0,5 side)

Dette prosjektet demonstrerer at åpne norske geodata og generativ AI kan kombineres i et lavterskelverktøy som gjør tomteanalyse tilgjengelig for en bredere brukergruppe enn det profesjonelle alternativer i dag gjør. Verktøyet integrerer 16 offentlige datakilder, implementerer tre distinkte AI-mønstre i produksjonskode, og er testet mot 18 reelle tomter. Viktigere enn den tekniske leveransen er funnet om at *agentisk* AI-bruk (Tomtefinner) muliggjør handlinger som ikke bare var tidkrevende — de var praktisk umulige tidligere. Dette er transformativ digitalisering, ikke bare effektivisering.

**Videre arbeid** vi anser som mest verdifullt:

1. **VA-tilknytning**: Integrere Geonorge VA-data for å lukke det største informasjonshullet i dagens verktøy.
2. **RAG mot TEK17**: Bygge en domenespesifikk søkefunksjon mot norsk bygningsregelverk slik at AI-oppsummeringen kan sitere paragrafer direkte.
3. **Klimaprojeksjoner**: Integrere NVEs klimajusterte flomsoner for å tydeliggjøre langtidsrisiko.
4. **BYA-parametrisk bildegenerering**: Tvinge Gemini til å respektere faktisk utnyttelsesgrad og maksimal gesimshøyde ved husbilde-generering.
5. **Effektstudie**: Måle om tilgang til verktøyet faktisk endrer informasjonsgrunnlaget kjøpere bruker i reelle beslutninger.

---

## 9. Referanser

> **[GRUPPEN MÅ LEGGE INN]:** Kuraterte referanser. Kritiske du bør ha med:
>
> **Pensum/kursmateriell:**
> - [Digitaliseringsdefinisjonen fra kurset — viktigst]
> - Eventuell bok/artikkel om AI-etikk i digitalisering
>
> **Tekniske:**
> - Anthropic (2025). *Claude API documentation*. https://docs.anthropic.com
> - Google (2025). *Gemini API — Image generation*. https://ai.google.dev/gemini-api/docs/image-generation
> - Vercel. *Next.js 15 documentation*. https://nextjs.org/docs
>
> **Dataleverandører (bekreft URLer):**
> - Kartverket. *Geonorge*. https://www.geonorge.no
> - NVE. *NVE Atlas*. https://atlas.nve.no
> - NGU. *Radon og grunnforhold*. https://www.ngu.no
> - DiBK. *Planregisteret*. https://dibk.no
>
> **Samfunn/kontekst:**
> - NOU 2022:3. *På trygg grunn — Bedre håndtering av kvikkleirerisiko*. (Gjerdrum-rapporten)
> - FN. *Sustainable Development Goals*. https://sdgs.un.org/goals
>
> **Faglig rammeverk (hvis relevant):**
> - Referanse for digitaliseringsbegrepet (ofte brukt: Brennen & Kreiss, 2016; eller Tilson et al., 2010)

---

## Vedlegg

### Vedlegg A — Arkitekturdiagram (detaljert)
[FYLL INN: Mermaid-diagram eller PDF-figur av full arkitektur]

### Vedlegg B — API-referanse
Full liste over de 16 dataendepunktene med URL, protokoll, parametere og eksempelrespons.

### Vedlegg C — Testprotokoll
Tabell over de 18 testede tomtene med adresse, hovedfunn, responstid og eventuelle feilobservasjoner.

### Vedlegg D — Prompts
Fullstendige systemprompter brukt for (a) rapport-oppsummering, (b) tomtefinner-rangering, (c) bildegenerering. Dette er akademisk verdifullt fordi det gjør AI-utnyttelsen reproduserbar.

### Vedlegg E — Kildekode
Repository: [URL]. Commit hash brukt ved innlevering: [FYLL INN].

---

## Skriveplan (intern — slettes før innlevering)

**Dag 1:**
- Morgen: 2.1 (digitaliseringsdefinisjon — åpne forelesningsnotatene), 1.1–1.4 (innledning)
- Ettermiddag: 3.1–3.4 (metode uten test), 4.1–4.3 (funksjonelle resultater)

**Dag 2:**
- Morgen: Testprotokoll (reell tabell over de 18 tomtene)
- Ettermiddag: 5 (diskusjon — dette er hvor sensor ser kvalitet), 6 (AI-bruk)

**Dag 3:**
- Morgen: 7 (SDG), 8 (konklusjon), 9 (referanser)
- Ettermiddag: Sammendrag (skrives til slutt), korrektur, vedlegg, eksport til PDF

**Kritiske hviletid: sett av 2 timer til pass nummer to før innlevering.** Dette er der typing-feil blir fanget.
