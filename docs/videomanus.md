# Videomanus — Tomtesjekk (BYG509 Assignment 3)

**Varighet:** 10-15 minutter
**Struktur:** ~7 min demo + ~6 min utvikling/refleksjon + ~2 min avslutning

---

## DEL 1: Demonstrasjon (~7 min)

### Intro (1 min)

> "Hei, vi er [NAVN], og dette er Tomtesjekk — et verktøy vi har utviklet for BYG509. Tomtesjekk er et webbasert analyseverktøy som lar hvem som helst gjøre en screening av en norsk tomt — på under ett minutt."

> "Problemet vi løser er enkelt å forstå: hvis du vurderer å kjøpe en tomt i Norge i dag, må du inn på NVE for å sjekke flomfare, NGU for radon og grunnforhold, DiBK for reguleringsplan, Statens vegvesen for veitilgang og støy, SSB for byggekostnader, Riksantikvaren for kulturminner, og kommunens planinnsyn. Det er 8 forskjellige portaler. I praksis tar dette 1-2 timer per tomt, og det forutsetter at du vet hva du leter etter."

> "Tomtesjekk samler alt dette i ett verktøy. La meg vise."

### Live demo — Analyser tomt (3 min)

*[Åpne https://tomtesjekk.vercel.app/analyser]*

> "Vi starter med å søke opp en adresse. Jeg skriver inn [ADRESSE] og klikker Analyser."

*[Vis fremdriftslinjen mens den jobber]*

> "Verktøyet kjører nå 14 parallelle API-kall mot offentlige norske datakilder. Dere kan se stegene her: eiendom, reguleringsplan, kulturminner, NVE flom og skred, radon, grunnforhold, byggekostnader, veitilgang, støy, solforhold, VA-tilknytning, og til slutt AI-oppsummering."

*[Vis sidepanelet med resultat]*

> "Her ser vi resultatet. Øverst: samlet risikovurdering med fargede dots for hver dimensjon — grønt er lav risiko, gult er moderat, rødt er høyt. Under det: AI-oppsummeringen."

> "Legg merke til at AI-en siterer TEK17-paragrafer direkte — her ser vi §13-5 for radon og §7-3 for grunnforhold. Den gir også kostnadsestimater med usikkerhetsnivå — ikke et tall, men et intervall. Det er bevisst: vi vil ikke at noen tar et AI-generert tall til banken som om det var en fasit."

*[Klikk Full rapport]*

> "Detaljer-siden viser alt: klimaprojeksjon mot 2100 med havstigning og nedbørendring, AI-analyse av kartbildet, byggemuligheter basert på reguleringsplanen, og alle 14 analysekortene med kart per kategori."

*[Scroll gjennom noen kort — vis BYA-griden, VA-kortet, klima-seksjonen]*

> "Ned her ser vi FNs bærekraftsmål som verktøyet adresserer — SDG 11.3, 11.5 og 13.1. Og helt til slutt: PDF-eksport av hele rapporten."

### Live demo — AI Tomtefinner (2 min)

*[Gå til /tomtefinner]*

> "Den andre hovedfunksjonen er AI Tomtefinner. I stedet for å analysere en spesifikk tomt du allerede kjenner, kan du beskrive hva du vil bygge — og la verktøyet finne aktuelle områder."

> "Jeg velger kommune Skien, bygningstype enebolig, og krysser av for lav naturfare."

*[Klikk Finn tomter — vis streaming-statusen]*

> "Nå skjer det mye under panseret: verktøyet genererer 144 prøvepunkter over hele kommunen, sjekker regulering på hvert punkt, filtrerer mot bygningstype, kjører NVE risikosjekk, og analyserer de beste kandidatene med 9 ulike API-kall hver."

*[Vis resultater med utfoldbare detaljer]*

> "Her fikk vi 4 kandidater. Bekkegata 8 scorer 85 av 100. Hvis jeg folder ut detaljene ser jeg reguleringsplan, naturfare, radon, grunnforhold, veitilgang, støy, solforhold, eiendomsdata og VA-tilknytning — alt automatisk. Og jeg kan klikke 'Kjør full tomteanalyse' for å få den komplette rapporten."

> "Denne funksjonen er genuint ny — det finnes ikke et tilsvarende verktøy i Norge som gjør omvendt tomtesøk med automatisk analyse."

### Demo — kvalitet og ærlighet (1 min)

> "Et viktig poeng: verktøyet er bevisst ydmykt. Det sier aldri 'dette koster 150 000 kr' — det sier 'typisk mellom 100 000 og 500 000 kr, avhengig av grunnforhold — innhent tilbud'. Det flaggar alltid VA-tilknytning som en ukjent kostnad. Det siterer TEK17-paragrafer med lenker. Og det sier eksplisitt at rapporten ikke erstatter profesjonell rådgivning."

> "Dette er en screening — ikke en geoteknisk rapport. Men det er en screening som gir deg grunnlaget for å stille de riktige spørsmålene."

---

## DEL 2: Utvikling og egen innsats (~6 min)

### Digitaliseringsdefinisjonen (1 min)

> "Kurset definerer digitalisering som prosessen med å bruke digitale verktøy på måter som skaper merverdi sammenlignet med situasjonen før disse verktøyene ble introdusert."

> "Tomtesjekk oppfyller dette på to nivåer. Første nivå: det effektiviserer — 8 portaler og 2 timer blir 1 klikk og 60 sekunder, en faktor 100-200 i tidsbesparelse. Andre nivå: det muliggjør noe nytt — AI Tomtefinner gjør en handling som var praktisk umulig før. Du kan ikke manuelt sjekke 144 punkter i en kommune mot 9 datadimensjoner. Det er transformativ digitalisering, ikke bare effektivisering."

### Teknisk arkitektur (2 min)

> "Verktøyet er bygget med Next.js 15, deployet på Vercel, og bruker Tailwind CSS med et tilpasset editorial designsystem. Det integrerer 16 offentlige API-endepunkter."

*[Vis en liste eller diagram]*

> "La meg forklare de tre AI-mønstrene vi bruker:"

> "Mønster 1: Strukturert rapport. Claude Haiku får analysedataene og en TEK17-lookup-tabell, og returnerer strukturert JSON via tool use — ikke fri tekst. Det gir oss deterministisk rendering med røde flagg, kostnader med usikkerhetsnivå, og paragraf-referanser. Det eliminerer hallusinasjonsrisiko."

> "Mønster 2: Multimodal analyse. Gemini 2.5 Flash får et kartbilde av tomten og identifiserer vegetasjon, bebyggelse, terreng og adkomst. Det er visuell grounding — AI-en må forholde seg til det faktiske bildet."

> "Mønster 3: Agentisk pipeline. Tomtefinneren orkestrerer 144 reguleringssjekker, filtrerer, analyserer topp-kandidater med 9 API-kall hver, og lar Claude rangere dem. Alt streames som NDJSON til frontend underveis. Modellen tar beslutninger i løkken — den er ikke bare en tekstgenerator."

### Egen innsats og arbeidsfordeling (2 min)

> [FYLL INN: Hvem gjorde hva? Eksempler:]

> "Jeg jobbet primært med [API-integrasjonene / frontend / AI-promptene / testingen]. Konkret innebar det [beskriv 2-3 spesifikke ting du gjorde]. Vi brukte Claude Code som AI-kodingsassistent, og det er viktig å være ærlig om det: AI skrev mye av boilerplate-koden og hjalp med debugging. Men alle arkitekturvalg, problemdefinisjonen, testingen og den faglige vurderingen er vår."

> "Vi validerte verktøyet mot 5 kjente tomter — en med kvikkleire, en i flomsone, en med radonproblem, en med kulturminne, og en normal tomt. Nøyaktigheten var [FYLL INN] — NVE-dataene stemte [X/5], radon [X/5]. Den viktigste svakheten vi fant var [FYLL INN]."

### AI-bruk i utviklingen (1 min)

> "Vi brukte Claude Code gjennom hele utviklingen. Det er en AI-kodingsagent som kan lese filer, skrive kode, kjøre kommandoer og deploye. Vi styrte den med kravspesifikasjoner og godkjente alle endringer."

> "Etisk vurdering: All generert kode er lest og forstått av gruppen. Problemstilling og vurderinger er våre. Vi har ikke lagt inn kode vi ikke kan forklare."

---

## DEL 3: Refleksjon og avslutning (~2 min)

### Hva vi oppnådde (30 sek)

> "Vi har levert et operativt verktøy som er deployet i produksjon, testet mot reelle tomter, og tilgjengelig for hvem som helst på tomtesjekk.vercel.app. Det integrerer 16 datakilder, bruker 3 distinkte AI-mønstre, og gir en rapport med juridisk forankring i TEK17."

### Hva vi ville gjort annerledes (1 min)

> [FYLL INN ærlige refleksjoner. Eksempler:]

> "Hvis vi startet på nytt ville vi prioritert VA-data tidligere — det viste seg å være den dyreste ukjente på en tomt, og vår heuristiske løsning er svakere enn vi ønsket."

> "Vi ville også brukt mer tid på validering fra starten. 5 testtomter er bedre enn null, men 20 hadde gitt oss statistisk signifikante funn."

> "Og vi ville tonet ned AI-bildegenerering tidligere — vi brukte mye tid på det før vi innså at tekst-baserte byggemuligheter gir mer reell verdi."

### FN bærekraftsmål (30 sek)

> "Til slutt: verktøyet adresserer tre av FNs bærekraftsmål. SDG 11.3 — vi demokratiserer tilgang til byggedata. SDG 11.5 — vi flagger flom- og skredrisiko før kjøp, direkte relevant etter Gjerdrum. SDG 13.1 — vi integrerer klimaprojeksjoner til 2100 i tomtevurderingen."

### Outro (15 sek)

> "Verktøyet er live på tomtesjekk.vercel.app — sensor kan teste det selv. Takk for oppmerksomheten."

---

## Tekniske tips for opptaket

- Bruk skjermopptak (OBS Studio gratis) med 1080p
- Ha nettleseren i fullskjerm, zoom til 110% for lesbarhet
- Kjør analysen på en tomt du har testet FØR opptaket — slik at du vet hva resultatet blir
- Ha en backup-tomt klar i tilfelle API-er er trege
- Snakk rolig — 10-15 minutter er mye tid, ikke stress
