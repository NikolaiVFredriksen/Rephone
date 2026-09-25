@AGENTS.md

# Rephone

Kjøp/salg-markedsplass for brukte telefoner. Solo-bygget interviewprosjekt for Edda.ai (frist neste onsdag).

## Stack

Next.js + TypeScript, fullstack via API routes. Ingen separat backend.

## AI-integrasjon (kjernefokus)

1. Kjøper-søk: fritekst inn ("beskriv hva du trenger") -> LLM tolker til strukturerte kriterier (budsjett, OS, prioritet) -> vis som chips -> query mot databasen -> resultater med kort AI-begrunnelse per treff.
2. Selger pris-intelligens: bruker beskriver telefonen -> AI henter lignende annonser fra databasen -> foreslår prisintervall med begrunnelse.
   Ikke bygg: bildeanalyse-AI (bilde er kun vanlig opplasting), multi-turn chatbot.

## Design

Palett: kremhvit bunn, terrakotta som aksentfarge (varm, jordnær, IKKE identisk med Edda sin palett, kun bevegelsesfilosofien er inspirert derfra).
Prinsipp: bevegelse skal være knyttet til data (tall som teller opp, resultater som beregner seg), ikke pynt.
Struktur: dynamisk hjemmeside (hero + scroll til resultater), enkle egne routes for annonsedetalj og opprett-annonse.

## Planlagt forbedring (mandag)

Legge til batteryHealth (Int, prosent) på Listing. FINN og lignende markedsplasser mangler dette som strukturert felt, kun fritekst. Gir AI-søket noe ekte å filtrere på i stedet for å gjette fra beskrivelse.

## Kommandoer

- `npm run dev` start dev-server
