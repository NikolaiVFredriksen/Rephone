# Guest-access log

Formål: ikke-innloggede brukere som trykker "Selg" skal få en tydelig
innloggingsport, med mulighet til å fortsette som gjest uten å registrere seg.

## Avvik fra oppgavebeskrivelsen (dokumentert, ikke rettet selv)

- `src/components/shared/LogoutButton.tsx` finnes ikke. Utloggingslogikken
  ligger i stedet inline i `Header.tsx` (en `<form>` med `signOut`-kall).
  Jeg har lest `Header.tsx` for å forstå denne logikken i stedet.

## Oppgave 1 — Portkort (SellGate)

**Hvorfor:** Uten innlogging fikk brukeren rett og slett vist salgsskjemaet,
som enten ville feile usynlig et sted i flyten eller publisere en annonse
uten eier. En tydelig port før skjemaet gjør det klart HVORFOR du må gjøre
noe, og gir et alternativ (gjest) i stedet for en dødsone.

Endringer:
- `src/app/page.tsx` er nå en async server-komponent som kaller `auth()` og
  sender `isLoggedIn` som prop til `HomeContent` — det er eneste endringen
  der, ingen annen logikk lagt til.
- `HomeContent.tsx` tar imot `isLoggedIn` som prop og viser `SellGate` i
  stedet for `SellFlow` når modus er "selg" og brukeren ikke er innlogget.
  Kjøp-siden er upåvirket (bruker fortsatt `BuyFlow` uavhengig av
  innlogging).
- Ny fil `src/components/sell/SellGate.tsx`: overskrift, hjelpetekst og tre
  knapper ("Logg inn" → `/logg-inn`, "Opprett konto" → `/registrer`,
  "Fortsett som gjest"). Samme palett og stil som resten av appen (rundede
  knapper, samme fargekoder som `logg-inn/page.tsx` bruker).

**Foreløpig uferdig, med vilje:** "Fortsett som gjest"-knappen er ren
markup i denne commiten, uten `onClick` — selve gjesteinnloggingen er
oppgave 2. Bygger og typechecker likevel, siden en knapp uten handler er
gyldig TSX, bare ikke funksjonell enda.

**Bør sjekkes visuelt:** besøk forsiden uten å være innlogget, trykk
"Selg" i toggle-en, og se at portkortet vises med riktig tekst og at
"Logg inn"/"Opprett konto" faktisk navigerer dit de skal. Logg inn og
bekreft at "Selg" nå viser det vanlige salgsskjemaet som før. Bekreft at
"Kjøp" fungerer uendret, innlogget eller ikke.
