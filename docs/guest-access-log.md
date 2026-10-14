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

## Oppgave 2 — Gjesteinnlogging

**Hvorfor:** "Fortsett som gjest" uten faktisk innlogging bak knappen hadde
vært en blindvei. `auth.ts` eksporterer `signIn`, så jeg brukte den direkte
fra en server action i stedet for å gjette meg til en annen løsning eller
røre `auth.ts`.

Endringer:
- Ny fil `src/app/actions/guest-login.ts` (`"use server"`): leser
  `DEMO_USER_EMAIL` og `DEMO_USER_PASSWORD` fra miljøet, kaller
  `signIn("credentials", { email, password, redirect: false })` fra
  `@/auth`. Returnerer `{ success: true }` eller `{ error: "..." }` —
  ALDRI selve e-posten/passordet, kun en generisk feiltekst, og
  `console.error` logger bare at innloggingen feilet, ikke noen
  credentials.
- Ny fil `src/components/shared/GuestButton.tsx`: klient-knapp som kaller
  `guestLogin()`, viser "Logger inn..." mens den venter, en feiltekst hvis
  den feiler, og kaller `router.refresh()` ved suksess — det er dette som
  gjør at siden viser salgsskjemaet uten full omlasting (se under).
- `SellGate.tsx` bruker nå `GuestButton` i stedet for den tomme
  plassholder-knappen fra oppgave 1.

**Hvorfor `router.refresh()` er nok:** `isLoggedIn` kommer fra en
server-komponent (`page.tsx`) som leser `auth()` på hver request.
`router.refresh()` ber Next.js kjøre server-komponentene på nytt med
samme URL, uten en full side-omlasting i nettleseren — `HomeContent` får
dermed en fersk `isLoggedIn={true}` som prop, og viser `SellFlow` i stedet
for `SellGate` automatisk.

**Kan ikke testes av meg:** jeg kan ikke kjøre en faktisk innlogging eller
se resultatet i nettleseren. Dette er uprøvd kode frem til du tester det
selv.

**Bør sjekkes visuelt/manuelt:** sett `DEMO_USER_EMAIL`/`DEMO_USER_PASSWORD`
i `.env.local` (se seed-instruksjonen i oppgave 3), kjør seed-scriptet, gå
til "Selg" uten å være innlogget, trykk "Fortsett som gjest". Forventet:
knappen viser "Logger inn...", og salgsskjemaet dukker opp uten at siden
laster på nytt (ingen hvit blink/full reload). Prøv også uten at
miljøvariablene er satt — skal vise feiltekst, ikke krasje.

## Oppgave 3 — Demo-bruker (seed-script)

**Hvorfor:** Gjesteinnloggingen i oppgave 2 forutsetter at det faktisk
finnes en bruker med e-post/passord fra `DEMO_USER_EMAIL`/
`DEMO_USER_PASSWORD` i databasen. Uten et skript måtte denne brukeren
opprettes manuelt hver gang, og lett ende opp med et passord som ikke
matcher miljøvariabelen.

Ny fil `prisma/seed-demo-user.ts`, etter samme mønster som
`seed-reference-prices.ts` (egen `PrismaClient` med `PrismaPg`-adapter og
`dotenv/config`, ikke appens delte `@/lib/prisma`, siden dette er et
frittstående Node-skript utenfor Next.js). Hasher passordet med
`bcrypt.hash(password, 10)` — nøyaktig samme kall som `/api/register`
bruker. Bruker `prisma.user.upsert` på e-post, så scriptet er trygt å
kjøre flere ganger (oppdaterer passordet i stedet for å lage en duplikat
hvis det kjøres igjen med et nytt passord i miljøet).

Kaster en tydelig feil (uten å skrive ut verdiene) hvis miljøvariablene
ikke er satt, i stedet for å stille lage en bruker med `undefined` som
passord.

**Hvordan kjøre det:** `npx tsx prisma/seed-demo-user.ts` fra
prosjektroten, med `DEMO_USER_EMAIL` og `DEMO_USER_PASSWORD` satt i
`.env`/`.env.local` (eller i miljøet) sammen med `DATABASE_URL`. Jeg har
IKKE kjørt dette scriptet selv — det ville krevd ekte miljøvariabler jeg
ikke har, og skrevet til den faktiske databasen. Kjør det selv og bekreft
at det skriver "Demo-bruker er klar." uten feil.

**Må settes i Vercel (Project Settings → Environment Variables):**
`DEMO_USER_EMAIL` og `DEMO_USER_PASSWORD` — begge for alle miljøer der
gjesteinnlogging skal fungere (Production/Preview/Development etter
behov). Kjør deretter seed-scriptet mot samme database (f.eks. via
`vercel env pull` lokalt, eller kjør scriptet fra et miljø som har
tilgang til produksjons-`DATABASE_URL`).
