# Rephone — forberedelse til jobbintervju

Dette dokumentet er en grundig gjennomgang av hele Rephone-prosjektet, skrevet for deg som frontend-utvikler med begrenset backend-erfaring. Målet er at du skal kunne forklare og forsvare hvert eneste valg i koden under intervjuet på onsdag.

---

## 1. Hva er Rephone, og hvorfor er det bygget slik det er?

Rephone er en **kjøp/salg-markedsplass for brukte telefoner** — et interviewprosjekt for Edda.ai, bygget solo på kort frist (under en uke). Det er ikke ment å være et komplett produkt, men en demonstrasjon av at du kan bygge en fullstack AI-drevet applikasjon raskt og med gjennomtenkte valg.

### Bevisste valg og hvorfor

**Next.js fullstack, ingen separat backend.** Alt — frontend, API, autentisering, databasekall — ligger i én Next.js-app via **Route Handlers** (`src/app/api/**/route.ts`). Dette er det viktigste arkitektoniske valget i hele prosjektet: med én uke til rådighet er det ingen grunn til å bygge og deploye en separat Express/Fastify/NestJS-backend. Next.js sin App Router lar deg skrive server-kode (databasekall, AI-kall, autentisering) i de samme mappene som frontend-koden, med TypeScript-typer delt mellom dem. Mindre "limkode", færre ting som kan gå galt, raskere å demonstrere.

**AI er kjernefokuset, ikke et påheng.** Oppgaven ber eksplisitt om to AI-funksjoner, og de er bygget som *ekte* to-stegs pipelines (LLM tolker fritekst → strukturert query mot database → LLM begrunner resultater), ikke bare "spør ChatGPT og vis svaret":

1. **Kjøper-søk** (`/api/search`): fritekst → strukturerte kriterier (budsjett, merke, prioriteringer) → database-query → resultater med AI-begrunnelse per treff.
2. **Selger pris-intelligens** (`/api/price-suggestion`): fritekst-beskrivelse → AI henter lignende annonser fra databasen → foreslår prisintervall med begrunnelse.

Legg merke til mønsteret: **LLM-et gjetter aldri en pris eller et resultat i tomt rom.** Det henter alltid ekte data fra Postgres-databasen først, og begrunner svaret basert på den dataen. Dette er et bevisst designvalg du bør fremheve i intervjuet — det er forskjellen på en "AI-demo" og et system som faktisk bruker databasen sin som sannhetskilde (grounding).

**Bevisst utelatt («Ikke bygg»):** bildeanalyse-AI (bilder er bare vanlig filopplasting, ingen AI ser på dem) og multi-turn chatbot. Dette er like viktig å kunne forklare som det du *har* bygget — det viser at du har forstått scope og prioritert riktig under tidspress, i stedet for å spre deg tynt.

**En tredje AI-funksjon i praksis: `/api/generate-description`.** Denne står ikke i den opprinnelige planen, men er lagt til underveis (se `GenerateDescription.tsx` og API-ruten, begge `??` i git status — helt ferske, ikke committet ennå). Den genererer en kort, ærlig annonsetekst basert på merke/modell/tilstand/pris. Verdt å nevne i intervjuet som et eksempel på at du utvidet scope litt der det var billig og naturlig (ett enkelt LLM-kall, ingen ny kompleksitet), uten å bryte "ikke bygg"-reglene.

**Design: bevegelse knyttet til data, ikke pynt.** Paletten er kremhvit bunn (`#FBF7F0`) med terrakotta som aksentfarge (`#C4622E`) — varm og jordnær, bevisst *ikke* identisk med Edda sin egen palett (kun bevegelsesfilosofien er inspirert derfra: tall som teller opp, resultater som beregner seg, ikke dekorative animasjoner). I praksis i dagens kode er fargene lagt inn som inline `style`-objekter per komponent (f.eks. i `Hero.tsx`), ikke som Tailwind theme-tokens i `globals.css` — det filen fortsatt har standardverdiene fra `create-next-app`. Det er en snarvei som er helt grei for et interviewprosjekt, men vær forberedt på spørsmålet "hvordan ville du skalert dette design-systemet?" — svaret er å flytte fargene inn i `@theme` i `globals.css` eller til CSS-variabler.

**Struktur:** dynamisk hjemmeside (`Hero.tsx` — hero-seksjon som scroller til resultater når man søker), pluss enkle egne routes for annonsedetalj (`/annonse/[id]`) og opprett-annonse (`/opprett`).

**Planlagt for mandag:** `batteryHealth` (Int, prosent) skal legges til på `Listing`-modellen. Dette er *ikke* i koden ennå (verken i `schema.prisma` eller migrasjonene). Motivasjonen er smart å kunne forklare: FINN og lignende markedsplasser har ikke batterihelse som et strukturert felt, bare fritekst i beskrivelsen — så AI-søket må gjette. Med et eget felt får AI-søket noe eksakt å filtrere/sortere på. Du ser faktisk spor av dette allerede i `Hero.tsx` (linje 334–350): et "Batterihelse"-inputfelt finnes i step 2 av selger-flyten, men det er **ikke koblet til noen state ennå** — det er ren frontend-forberedelse for en backend-endring som kommer mandag. Dette er et fint eksempel å vise frem: du planlegger databaseendringer *sammen med* UI-et som skal bruke dem.

---

## 2. Databasen: Neon, Prisma og hvordan de henger sammen

### Neon

Neon er en **serverless Postgres**-leverandør. Poenget med "serverless" her er ikke at det ikke finnes en server — det er en ekte Postgres-database — men at du ikke administrerer den selv: den skalerer (og kan "sove" ved inaktivitet) automatisk, og du betaler for bruk i stedet for en fast server som går døgnet rundt. For et kort interviewprosjekt er dette ideelt: null DevOps, database er klar på sekunder.

Neon sin signaturfunksjon er **database branching** — akkurat som Git-branches, men for data. `neon.ts` i rotmappen definerer branch-policyen:

```ts
branch: (branch) => {
  if (branch.isDefault) return {};       // hovedbranchen, ingen spesialregler
  if (!branch.exists) return { ttl: "7d" }; // nye branches utløper automatisk etter 7 dager
  return {};
}
```

Dette betyr at hvis man lager en ny database-branch for f.eks. en feature-branch (matcher `feature/hero-search` i git), får den en 7-dagers levetid og ryddes automatisk opp. Praktisk for en solo-utvikler som ikke vil betale for eller huske å slette gamle test-databaser. `.env`-filen har `NEON_BRANCH` som variabel, som styrer hvilken branch appen kobler seg til.

### Prisma

Prisma er et **ORM** (Object-Relational Mapper) — et lag mellom TypeScript-koden din og SQL-databasen. I stedet for å skrive rå SQL (`SELECT * FROM "Listing" WHERE ...`), skriver du TypeScript: `prisma.listing.findMany({ where: { ... } })`. Prisma genererer fullt typede funksjoner basert på databaseskjemaet ditt, så du får autocomplete og kompileringsfeil hvis du bommer på et feltnavn — svært verdifullt når du (som frontend-utvikler) ikke er vant til å tenke i SQL.

Viktig detalj for intervjuet: dette prosjektet bruker **Prisma 7** (se `package.json`: `"prisma": "^7.10.0"`), som har en god del breaking changes fra Prisma 5/6 som mye opplæringsmateriale fortsatt viser. To ting er spesielt merkbare i denne kodebasen:

- Generatoren heter `prisma-client` (ikke det gamle `prisma-client-js`), og outputen havner i en egen mappe (`src/generated/prisma`) i stedet for i `node_modules`.
- Prisma 7 krever et **eksplisitt driver adapter** — klienten kobler seg ikke lenger til databasen "av seg selv". Du må gi den en adapter som vet hvordan den snakker med akkurat din database-driver.

Filene henger sammen slik:

**`prisma/schema.prisma`** — selve datamodellen, skrevet i Prisma sitt eget skjemaspråk. Definerer:
- `generator client` — sier at Prisma skal generere en TypeScript-klient (`prisma-client`), og legge den i `../src/generated/prisma`.
- `datasource db` — sier at databasen er `postgresql` (selve URL-en kommer fra miljøvariabelen `DATABASE_URL`, satt via `prisma7.config.ts`, se under).
- To **enums**: `Condition` (NY, PENT_BRUKT, BRUKT, GODT_BRUKT) og `ListingStatus` (AKTIV, SOLGT). Enums gir deg en lukket liste med gyldige verdier — Postgres håndhever dette på databasenivå, ikke bare i TypeScript.
- To **modeller**: `User` (id, email, passwordHash, name, createdAt, og en liste med `listings`) og `Listing` (id, title, brand, model, condition, price, description, imageUrl (valgfri, `?`), status, createdAt, sellerId + en `seller`-relasjon tilbake til `User`). `sellerId String` + `seller User @relation(fields: [sellerId], references: [id])` er standardmåten Prisma uttrykker en foreign key på — én bruker kan eie mange annonser (one-to-many).

**`prisma7.config.ts`** — konfigurasjonsfilen for selve Prisma-verktøyet (CLI-kommandoer som `prisma migrate`, `prisma generate`, `prisma db seed`). Dette er en ny greie i Prisma 7 — tidligere lå denne konfigen som et `"prisma"`-felt inne i `package.json`, nå er den en egen fil som bruker `defineConfig()`:

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

Den forteller Prisma CLI-et hvor skjemaet ligger, hvor migrasjonene skal lagres, hvilken kommando som skal kjøre seed-scriptet (`tsx prisma/seed.ts` — kjører TypeScript direkte uten separat kompileringssteg), og hvilken database-URL som skal brukes (hentet fra `.env` via `dotenv/config` som importeres øverst).

**`src/lib/prisma.ts`** — dette er klienten som *appen* (API-rutene) faktisk bruker til å snakke med databasen, i motsetning til `prisma7.config.ts` som CLI-verktøyet bruker:

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Her ser du driver-adapter-kravet i praksis: `PrismaPg` er adapteren som kobler den genererte Prisma-klienten til `pg`-pakken (den faktiske Postgres-driveren for Node.js). Uten denne adapteren vet ikke `PrismaClient` hvordan den skal snakke med databasen i det hele tatt i Prisma 7.

`globalForPrisma`-mønsteret er en klassisk Next.js-dev-fiks: i utviklingsmodus (`next dev`) hot-reloader Next.js modulene dine hele tiden, og hver reload ville normalt laget en helt ny `PrismaClient` — som igjen åpner en ny database-tilkoblingspool. Uten dette mønsteret ville du fort tettet igjen antall tillatte tilkoblinger mot Postgres etter noen minutters koding. Ved å lagre klienten på `globalThis` (som overlever hot reloads), gjenbruker du samme instans. I produksjon (`NODE_ENV === "production"`) skjer ikke hot reload, så der lagres den ikke globalt — hver server-instans får sin egen, som er riktig oppførsel der.

**`prisma/migrations/20260924070939_init/migration.sql`** — den faktiske SQL-en som Prisma genererte og kjørte for å bygge databasen fra `schema.prisma`. Mappenavnet (`20260924070939_init`) er et tidsstempel + navn, slik at migrasjoner kjøres i riktig rekkefølge og aldri kjøres på nytt. Denne filen oppretter enum-typene, begge tabellene, en unik indeks på `User.email`, og foreign key-constrainten fra `Listing.sellerId` til `User.id`. Poenget med migrasjoner er versjonskontroll for databasestrukturen — akkurat som Git versjonerer kode, versjonerer migrasjoner databaseskjemaet, slik at du (og andre) kan gjenskape databasen fra scratch eller oppdatere en eksisterende database trinn for trinn. Når `batteryHealth` legges til mandag, blir det en ny migrasjonsfil med `ALTER TABLE "Listing" ADD COLUMN ...`.

**`migration_lock.toml`** — en liten fil som bare låser hvilken database-provider migrasjonene er skrevet for (`postgresql`), slik at Prisma nekter å ved et uhell blande migrasjoner laget for f.eks. MySQL inn i et Postgres-prosjekt.

**`prisma/seed.ts`** — kjøres via `prisma db seed` (eller automatisk ved `migrate reset`) for å fylle databasen med testdata: én test-selger (med passord hashet via bcrypt — se del 3) og 16 telefonannonser med realistiske norske beskrivelser. `upsert` brukes på brukeren (opprett hvis den ikke finnes, ellers ingenting) slik at scriptet er trygt å kjøre flere ganger uten å lage duplikater.

**Kort oppsummert flyten:** du endrer `schema.prisma` → kjører `prisma migrate dev` → Prisma genererer en ny SQL-migrasjon i `prisma/migrations/` og oppdaterer databasen → Prisma genererer samtidig en oppdatert TypeScript-klient i `src/generated/prisma/` → `lib/prisma.ts` bruker denne genererte klienten (pakket inn i en singleton med driver-adapteren) → API-rutene dine importerer `{ prisma }` fra `@/lib/prisma` og får fullt typet databasetilgang.

---

## 3. Autentisering: NextAuth, JWT, bcrypt og callbacks

### NextAuth (Auth.js v5)

`next-auth` (versjon `5.0.0-beta.32`, ofte kalt Auth.js) er et bibliotek som håndterer innlogging, sesjoner og sikkerhet rundt autentisering, slik at du slipper å skrive dette fra bunnen (som er overraskende lett å gjøre feil på en usikker måte). I `src/auth.ts` settes hele konfigurasjonen opp med `NextAuth({...})`, som returnerer et sett med ferdige verktøy:

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({ ... });
```

- `handlers` — GET/POST-funksjoner som håndterer alle autentiseringsrelaterte HTTP-kall (innlogging, utlogging, CSRF-token, osv.). Disse eksporteres videre i `src/app/api/auth/[...nextauth]/route.ts`:
  ```ts
  export const { GET, POST } = handlers;
  ```
  `[...nextauth]` er en Next.js **catch-all route** — den fanger opp *alle* URL-er under `/api/auth/*` (f.eks. `/api/auth/signin`, `/api/auth/session`, `/api/auth/csrf`) og lar NextAuth selv avgjøre hva som skal skje, i stedet for at du må lage én fil per understi.
- `auth()` — en funksjon du kaller server-side (i API-ruter eller server-komponenter) for å hente den innloggede brukerens sesjon, f.eks. `const session = await auth()`.
- `signIn` / `signOut` — kalles fra klient-siden (i `logg-inn/page.tsx` og `registrer/page.tsx`) for å logge inn/ut.

Provideren som brukes er **Credentials** — altså e-post + passord, ikke Google/GitHub-innlogging. Dette er valgt fordi det er enklest å demonstrere uten å sette opp OAuth-apper hos tredjeparter, og fordi oppgaven ikke krever sosial innlogging.

### JWT (JSON Web Token)

`session: { strategy: "jwt" }` betyr at brukerens sesjon **ikke** lagres i databasen (det finnes ingen `Session`-tabell i `schema.prisma`!). I stedet krypteres/signeres all sesjonsinformasjon ned i en **JWT** — en token som lagres i en cookie i nettleseren. Tenk på det som en stemplet armbånd på en festival: alt festivalen trenger å vite om deg (at du har betalt, hvilken sone du har tilgang til) står skrevet *på* armbåndet og er forseglet slik at det ikke kan forfalskes, i stedet for at vakten må slå opp navnet ditt i en database hver gang. Fordelen er at serveren ikke trenger et databasekall for å sjekke om noen er innlogget — den kan bare verifisere signaturen på tokenet. Ulempen er at du ikke kan "logge ut" en bruker fra serversiden før tokenet naturlig utløper (det finnes ingen rad i databasen å slette).

### bcrypt / bcryptjs og hashing

Passord lagres **aldri** i klartekst — de lagres som en **hash** i `passwordHash`-kolonnen. Hashing er en enveisfunksjon: du kan regne ut hashen fra passordet, men du kan ikke regne deg tilbake fra hashen til passordet. `bcryptjs` (ren JavaScript-implementasjon av bcrypt-algoritmen, valgt trolig fordi den ikke krever native kompilering slik `bcrypt`-pakken gjør) brukes to steder:

- `bcrypt.hash(password, 10)` — ved registrering (`api/register/route.ts`) og i seed-scriptet. Tallet `10` er antall **salt rounds**: hvor mange ganger algoritmen "runder" hashingen. Høyere tall = tregere å regne ut = tregere for en angriper å brute-force-gjette passord, men også tregere for deg ved innlogging. 10 er en vanlig, balansert standardverdi.
- `bcrypt.compare(password, user.passwordHash)` — ved innlogging. Siden du ikke kan reversere hashen, kan du ikke sjekke om passordet er riktig ved å "dekryptere" — i stedet hasher `compare` det innsendte passordet på nytt (med samme salt som er lagret inni hashen) og sammenligner de to hashene.

### `authorize`-funksjonen linje for linje

Dette er hjertet av innloggingslogikken, i `src/auth.ts`:

```ts
authorize: async (credentials) => {
  const email = credentials.email as string;
  const password = credentials.password as string;
  if (!email || !password) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name };
},
```

1. **Linje 14–15**: henter ut `email` og `password` fra formen brukeren sendte inn (typet som `string` siden NextAuth sine typer i utgangspunktet er løsere, `unknown`-aktige).
2. **Linje 16**: hvis noen av feltene mangler, returner `null` med en gang — `null` er NextAuths signal for "innlogging feilet, ingen detaljert grunn gis" (bevisst vagt, av sikkerhetshensyn — du vil ikke fortelle en angriper *hvorfor* det feilet).
3. **Linje 18**: slå opp brukeren i databasen på e-post.
4. **Linje 19**: finnes ikke brukeren, returner `null`. Merk: den returnerer *ikke* en spesifikk feilmelding som "bruker finnes ikke" — samme `null` som ved feil passord. Dette hindrer at noen kan bruke innloggingsskjemaet til å sjekke hvilke e-poster som er registrert (unngår **user enumeration**).
5. **Linje 21**: sammenlign det innsendte passordet mot den lagrede hashen med `bcrypt.compare`.
6. **Linje 22**: feil passord → `null`, samme uspesifikke feil som over.
7. **Linje 24**: alt stemmer → returner et brukerobjekt. Dette objektet blir input til `jwt`-callbacken under.

### Callbacks — og hvorfor vi trengte dem

```ts
callbacks: {
  jwt({ token, user }) {
    if (user) token.id = user.id;
    return token;
  },
  session({ session, token }) {
    if (session.user) session.user.id = token.id as string;
    return session;
  },
},
```

Uten disse to callbackene ville NextAuth sitt JWT og session-objekt bare inneholde standardfeltene (`name`, `email`, `image`) — **ikke** `id`. Men i API-rutene våre (`listings/[id]/route.ts`, `listings/route.ts`) trenger vi `session.user.id` for å vite *hvilken* bruker som eier hvilken annonse (for å håndheve at bare eieren kan redigere/slette).

- `jwt`-callbacken kjører når et JWT opprettes eller oppdateres. `user`-parameteret er kun til stede rett etter innlogging (kommer fra det `authorize` returnerte) — da kopierer vi `user.id` inn i selve tokenet (`token.id = user.id`), slik at ID-en er "bakt inn" i den krypterte cookien.
- `session`-callbacken kjører hver gang koden kaller `auth()`/`useSession()` for å lese sesjonen. Den leser `id`-en tilbake *fra* tokenet og legger den på `session.user.id`, slik at resten av appen kan bruke `session.user.id` direkte.

Uten dette to-stegs-relèet (`user → token → session`) ville `session.user.id` alltid vært `undefined`, og eierskaps-sjekkene i API-rutene ville vært umulige å gjennomføre. `src/types/next-auth.d.ts` utvider TypeScript-typen til `Session` slik at `session.user.id` faktisk er typet som `string` og ikke gir kompileringsfeil (**module augmentation** — du "legger til" et felt på et bibliotek sin type uten å endre biblioteket selv).

---

## 4. API-endepunktene: Route Handlers og HTTP-metodene

### Hva er en Route Handler?

I Next.js App Router er en **Route Handler** en fil som heter nøyaktig `route.ts` inne i en mappe under `src/app/api/`. Mappestrukturen *er* URL-strukturen: `src/app/api/listings/route.ts` blir endepunktet `/api/listings`, og `src/app/api/listings/[id]/route.ts` blir `/api/listings/en-eller-annen-id` der `[id]` er en dynamisk segment du får tilgang til via `params`. Hver eksportert funksjon (`GET`, `POST`, `PATCH`, `DELETE`, osv.) i filen svarer på akkurat den HTTP-metoden. Dette er analogt til API routes i Pages Router (`pages/api/`), men her får hver HTTP-metode sin egen navngitte funksjon i stedet for én handler som selv sjekker `req.method`.

### GET vs. POST vs. PATCH vs. DELETE

- **GET** — hent data, skal aldri endre noe på serveren. Ingen body i requesten (data sendes via URL/query params).
- **POST** — opprett noe nytt, eller utfør en handling som ikke er en ren henting. Har en body (typisk JSON).
- **PATCH** — oppdater *deler* av en eksisterende ressurs (i motsetning til `PUT`, som konvensjonelt betyr "erstatt hele ressursen"). Her brukes `PATCH` for å redigere en annonse.
- **DELETE** — slett en ressurs.

### Gjennomgang av hvert endepunkt

**`/api/auth/[...nextauth]/route.ts`** — se del 3. Delegerer rett videre til NextAuth sine egne `handlers`.

**`/api/register/route.ts`** (kun `POST`): tar imot `{ email, password, name }`, validerer at alle felt finnes (400 hvis ikke), sjekker at e-posten ikke allerede er i bruk (400 hvis den er det — merk at her *er* det greit å avsløre om e-posten finnes, siden det er registrering, ikke innlogging), hasher passordet, og oppretter brukeren. Returnerer kun `id` og `email` — **aldri** `passwordHash` tilbake til klienten.

**`/api/listings/route.ts`**:
- `GET` — helt åpen, ingen innlogging kreves. Henter alle annonser med `status: "AKTIV"` (solgte annonser skjules automatisk fra hovedlisten), sortert nyest først.
- `POST` — krever innlogging. Sjekker `session?.user?.id` — hvis det mangler, `401 Unauthorized` ("Du må være innlogget"). Validerer at påkrevde felt finnes (`400` hvis ikke). Oppretter annonsen med `sellerId: session.user.id` — brukeren kan **ikke** selv oppgi hvem selgeren er, den settes alltid til den faktisk innloggede brukeren. Dette er en viktig sikkerhetsdetalj: aldri stol på en klient-oppgitt bruker-ID.

**`/api/listings/[id]/route.ts`**:
- `GET` — henter én annonse på ID. `404` hvis den ikke finnes.
- `PATCH` — krever innlogging (`401` ellers). Henter den eksisterende annonsen, `404` hvis den ikke finnes. Deretter en **eierskaps-sjekk**: `if (existing.sellerId !== session.user.id) return 403` ("Du eier ikke denne annonsen"). Dette er der `session.user.id` fra callback-oppsettet i del 3 faktisk brukes til noe konkret. Først etter begge sjekkene oppdateres annonsen med feltene fra body.
- `DELETE` — samme mønster: innlogging kreves, annonsen må finnes, og bare eieren kan slette.

Merk forskjellen mellom `401` (ikke innlogget i det hele tatt) og `403` (innlogget, men ikke autorisert til *denne* handlingen) — et klassisk skille som er verdt å kunne forklare presist i et intervju.

**AI-endepunktene** (`/api/search`, `/api/price-suggestion`, `/api/generate-description`) — se del 5 for full linje-for-linje-gjennomgang.

---

## 5. AI-integrasjonen: Anthropic SDK, tokens, og de to kjerne-flytene

### Anthropic SDK

`@anthropic-ai/sdk` er det offisielle Node.js/TypeScript-biblioteket for å kalle Claude-modellene via Anthropics API. I koden instansieres klienten enkelt: `const anthropic = new Anthropic();` (den plukker automatisk opp `ANTHROPIC_API_KEY` fra miljøvariablene). Hovedmetoden som brukes overalt er `anthropic.messages.create({...})`, som tar en `model`, `max_tokens`, en `system`-prompt (instruksjoner til modellen om *hvordan* den skal oppføre seg) og en `messages`-liste (selve samtalen/inputen).

### Tokens

Et **token** er den minste tekstbiten en språkmodell leser/skriver om gangen — omtrent tre-fire bokstaver i norsk/engelsk tekst i snitt (ikke nødvendigvis hele ord). Modeller har en pris per token (input og output prises ofte ulikt) og en øvre grense for hvor mange tokens de kan produsere per kall. `max_tokens: 300` betyr "stopp etter maks 300 tokens output" — satt lavt her fordi svarene forventes å være korte strukturerte JSON-objekter eller korte tekster, ikke lange avhandlinger. Å sette `max_tokens` riktig er både en kostnads- og en ytelses-optimalisering (kortere svar = raskere respons til brukeren).

### Hvorfor `claude-haiku-4-5`?

Haiku er Anthropics minste og raskeste (og billigste) modellfamilie. Den brukes i `/api/price-suggestion` og `/api/generate-description` fordi oppgavene er **strukturerte og avgrensede**: tolke en kort norsk tekst til noen få JSON-felt, eller skrive tre setninger reklametekst. Dette er oppgaver som ikke krever den dyreste og "smarteste" modellen — Haiku er raskere (viktig for en god brukeropplevelse i en synkron web-request der brukeren venter på svar) og billigere per kall, noe som betyr mye når hver brukerhandling trigger *to* separate LLM-kall etter hverandre (se under). Dette er et klassisk kost/ytelse-avveiningsvalg du bør kunne forsvare i intervjuet: "bruk den minste modellen som er god nok til jobben."

**Verdt å være obs på:** `/api/search/route.ts` bruker faktisk `claude-sonnet-4-6` i begge kallene sine, *ikke* Haiku, mens README/commit-historikken (`Added price suggestion with claude-haiku 4.5`) og CLAUDE.md-notatene nevner Haiku generelt for AI-funksjonene. Dette er trolig fordi søkefunksjonen ble bygget/testet med en kraftigere modell og ikke er justert ned ennå — helt greit å nevne som en bevisst mulig fremtidig optimalisering ("jeg vil A/B-teste om Haiku er godt nok her også, siden oppgaven er strukturelt lik price-suggestion"), i stedet for å late som det er tilsiktet inkonsistens.

### To-stegs-logikken i `/api/search` linje for linje

Formålet: bruker skriver fritekst om hva slags telefon de vil ha → resultater med begrunnelse.

```ts
const { query } = await req.json();
if (!query) return 400 "Mangler søk";
```
Henter fritekstsøket fra request-bodyen, avviser tomme søk.

**Kall 1 — tolk fritekst til filtre:**
```ts
const parseResponse = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 300,
  system: "Du tolker norske fritekst-søk etter brukte telefoner til JSON. Svar KUN med JSON, ingen annen tekst.",
  messages: [{ role: "user", content: `Tolk søket til JSON med feltene: budget..., brand..., priorities...\n\nSøk: "${query}"` }],
});
```
System-prompten tvinger modellen til å *kun* svare med JSON (ingen "Her er svaret:"-preludium), fordi svaret skal parses maskinelt rett etterpå. Brukerens fritekst limes rett inn i prompten.

```ts
const parseBlock = parseResponse.content[0];
const filters = parseBlock.type === "text" ? (parseJson(parseBlock.text) ?? {}) : {};
```
Svaret fra Claude kommer som en liste av "content blocks" (kan i prinsippet inneholde flere typer innhold); her plukkes det første blokken og sjekkes at det er tekst. `parseJson` er en liten hjelpefunksjon som fjerner eventuelle ```` ```json ````-kodeblokk-markører (modeller pakker ofte JSON i markdown-kodeblokker selv når man ber dem la være) og prøver `JSON.parse`. Hvis parsingen feiler av en eller annen grunn, faller den tilbake på et tomt objekt `{}` i stedet for å krasje hele requesten.

**Steg 2 — ekte database-query basert på filtrene:**
```ts
const listings = await prisma.listing.findMany({
  where: {
    status: "AKTIV",
    ...(filters.budget ? { price: { lte: filters.budget } } : {}),
    ...(filters.brand ? { brand: { equals: filters.brand, mode: "insensitive" } } : {}),
  },
  orderBy: { createdAt: "desc" },
  take: 10,
});
```
Her skjer selve "grounding"-en: filtrene fra LLM-et brukes til å bygge et *ekte* Prisma-`where`-objekt. `...(filters.budget ? {...} : {})` er et vanlig spread-triks for betingede felter i et objekt — hvis `filters.budget` ikke finnes, spres et tomt objekt inn (ingen effekt), ellers spres `{ price: { lte: filters.budget } }` inn. `mode: "insensitive"` gjør merke-sammenligningen case-insensitiv (så "iphone" og "iPhone" matcher likt). `take: 10` begrenser resultatet.

```ts
if (listings.length === 0) return NextResponse.json({ filters, results: [] });
```
Ingen treff → returner tidlig, ingen vits i å be Claude begrunne et tomt sett.

**Kall 2 — begrunn hvert treff:**
```ts
const reasoningResponse = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 500,
  system: "Du skriver en kort norsk begrunnelse (maks 15 ord) for hvorfor hver annonse passer søket. Svar KUN med JSON: array av { id, reason }.",
  messages: [{ role: "user", content: `Søk: "${query}"\n\nAnnonser:\n${JSON.stringify(listings.map(...))}` }],
});
```
Her sendes både det opprinnelige søket *og* de faktiske treffene (kun de feltene som trengs — id, title, brand, model, price, condition, ikke hele databaseobjektet) tilbake til Claude, og ber om en kort begrunnelse *per annonse-id*. Dette er andre halvdel av to-stegs-mønsteret: første kall gikk fritekst→struktur, andre kall går database-resultat→menneskelig begrunnelse.

```ts
const results = listings.map((listing) => ({
  ...listing,
  reason: reasons.find((r) => r.id === listing.id)?.reason ?? "",
}));
```
Til slutt kobles begrunnelsene tilbake på de faktiske annonsene ved å matche på `id`. `?? ""` sikrer at en annonse uten begrunnelse (f.eks. hvis Claude glemte en) bare får en tom streng i stedet for å krasje.

### To-stegs-logikken i `/api/price-suggestion` linje for linje

Formålet: selger beskriver telefonen sin i fritekst → AI foreslår et prisintervall basert på lignende, faktiske annonser i databasen.

**Kall 1 — tolk beskrivelse til merke/modell/tilstand:**
```ts
const parseResponse = await anthropic.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 300,
  system: 'Du tolker norske beskrivelser av brukte telefoner til JSON. Felt: brand..., model..., condition (ett av: NY, PENT_BRUKT, BRUKT, GODT_BRUKT, eller null hvis uklart). Svar KUN med JSON.',
  messages: [{ role: "user", content: description }],
});
```
Legg merke til at `condition`-feltene i prompten er nøyaktig de samme verdiene som `Condition`-enumen i `schema.prisma` — modellen blir eksplisitt fortalt hvilke gyldige verdier den kan bruke, slik at output kan mates rett inn i et Prisma-query eller vises direkte i UI-et uten videre oversettelse.

**Steg 2 — finn lignende annonser:**
```ts
const similar = await prisma.listing.findMany({
  where: {
    status: "AKTIV",
    ...(parsed.brand ? { brand: { equals: parsed.brand, mode: "insensitive" } } : {}),
    ...(parsed.model ? { model: { contains: parsed.model, mode: "insensitive" } } : {}),
  },
  orderBy: { createdAt: "desc" },
  take: 5,
});
```
Samme spread-mønster som i søket. Merk `contains` i stedet for `equals` på `model` — modellnavn er mindre standardiserte enn merkenavn (f.eks. "iPhone 13" vs. "iPhone 13 128GB"), så et delvis treff er mer robust enn et eksakt.

```ts
if (similar.length === 0) {
  return NextResponse.json({ parsed, priceRange: null, reasoning: "Fant ingen sammenlignbare annonser i databasen ennå, for tidlig å foreslå en pris." });
}
```
Dette er den viktigste sikkerhetslinjen i hele AI-integrasjonen (kommentaren i koden sier det rett ut): **hvis det ikke finnes sammenligningsgrunnlag, la ikke AI-en gjette i blinde.** I stedet for å be Claude finne på et tall uten data å basere det på (som ville vært ren hallusinasjon), returneres et eksplisitt "vi vet ikke ennå"-svar. Dette er nøyaktig samme "grounding"-prinsipp som i del 1 — verdt å trekke frem som bevisst produktdesign, ikke bare en teknisk detalj.

**Kall 2 — foreslå prisintervall:**
```ts
const suggestResponse = await anthropic.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 300,
  system: "Du foreslår et prisintervall i norske kroner for en brukt telefon, basert på lignende annonser. Svar KUN med JSON: { low, high, reasoning } der reasoning er maks 20 ord på norsk.",
  messages: [{ role: "user", content: `Beskrivelse: "${description}"\n\nLignende annonser: ${JSON.stringify(similar.map(...))}` }],
});
```
Beskrivelsen *og* de 5 mest lignende faktiske annonsene (kun modell, tilstand, pris — ikke hele objektet) sendes inn sammen, og Claude bes om et strukturert `{ low, high, reasoning }`-svar. Til slutt pakkes dette rett ut i responsen til frontend.

### `/api/generate-description` — den tredje, enklere AI-funksjonen

Bare ett kall, ingen database involvert: tar `{ brand, model, condition, price }` og ber Claude skrive maks tre nøkterne setninger reklametekst ("ikke overselg, ikke bruk utropstegn" — en bevisst tone-instruks i system-prompten for å unngå den typiske overivrige "🔥 KJEMPETILBUD!!!"-AI-tekst-stilen). Enklere fordi den ikke trenger å hente noe fra databasen først — den jobber kun med data brukeren allerede har bekreftet i UI-et.

---

## 6. Frontend: Hero.tsx, state, og GenerateDescription

### Hero.tsx — hovedkomponenten

`Hero.tsx` er en **client component** (`"use client"` øverst — nødvendig fordi den bruker `useState` og hendelseshåndterere, som ikke kan kjøre i en server component). Den styrer *hele* forsiden: både kjøper-søk-flyten og selger-flyten, i én komponent, styrt av `mode: "kjop" | "selg"`.

### Hvorfor så mange `useState`?

**State** er data som kan endre seg over tid og som komponenten må "huske" mellom rendringer — når state endres, rendrer React komponenten på nytt med de nye verdiene. `useState` er hooken som gir deg akkurat én bit av slik state om gangen (en verdi + en oppdateringsfunksjon). Grunnen til at det er *så mange* her (ti stykker) er at `Hero.tsx` egentlig håndterer to nokså forskjellige flyter i én komponent, og hver flyt har sin egen lille tilstandsmaskin:

- `mode` — hvilken av de to flytene som er aktiv.
- `input` — teksten i søkefeltet (delt mellom begge modus).
- `loading` / `error` — delt UI-tilstand for "venter på svar" / "noe gikk galt", brukt av begge flyter.
- `filters` / `results` — kjøper-flytens data: chipsene som vises (budsjett/merke/prioriteringer) og søkeresultatene.
- `priceSuggestion` — deklarert, men i praksis ikke lenger brukt til visning (prisforslaget vises via `draft` i stedet) — trolig en rest fra en tidligere iterasjon av selger-flyten, verdt å nevne som noe du ville ryddet opp i en refaktoreringsrunde.
- `images` — de (foreløpig) opptil 3 bildefilene brukeren har lastet opp i selger-flyten. Merk: disse lastes **aldri opp noe sted** i dagens kode (verken til `imageUrl`-feltet ved publisering eller en fil-lagringstjeneste) — `URL.createObjectURL(images[i])` lager bare en midlertidig lokal forhåndsvisnings-URL i nettleseren. Dette er tydelig et ufullstendig steg, konsistent med at bildeopplasting ikke var kjernefokus i oppgaven.
- `draft` — selger-flytens "kladd": det AI foreslo (merke, modell, tilstand, pris, begrunnelse) pluss beskrivelsen brukeren til slutt lander på. Dette er objektet som til slutt sendes til `/api/listings` for å faktisk opprette annonsen.
- `step` (`1 | 2 | 3`) — en enkel **state machine** for selger-flyten: 1 = skriv beskrivelse, 2 = se/juster AI-forslag (merke/modell/tilstand/pris), 3 = generer annonsetekst og publiser.

Med andre ord: mange `useState`-kall er ikke rot for rotets skyld — det er en direkte konsekvens av at komponenten holder styr på to fulle brukerflyter (kjøp og salg) samtidig, hver med flere steg. Et naturlig forbedringspunkt å nevne i intervjuet: dette kunne vært ryddet opp med `useReducer` (én state-maskin i stedet for ti separate `useState`), eller ved å splitte kjøp- og selg-flyten i to separate komponenter.

### `handleSubmit` steg for steg

```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!input.trim()) return;
```
Hindrer nettleserens standard skjema-innsending (som ville reloadet siden), og avviser tomt/whitespace-only input tidlig.

```ts
  setError(""); setResults([]); setFilters(null); setPriceSuggestion(null);
  setLoading(true);
```
Nullstiller all tidligere UI-tilstand før et nytt søk/forslag startes, og setter `loading` for å vise "Henter..." i UI-et.

```ts
  try {
    if (mode === "kjop") {
      const res = await fetch("/api/search", { method: "POST", ..., body: JSON.stringify({ query: input }) });
      const data = await res.json();
      setFilters(data.filters);
      setResults(data.results);
    } else {
      const res = await fetch("/api/price-suggestion", { method: "POST", ..., body: JSON.stringify({ description: input }) });
      const data = await res.json();
      if (data.priceRange) {
        setDraft({ brand: data.parsed?.brand ?? "", ..., price: data.priceRange.low, description: "", reasoning: data.reasoning ?? "" });
        setStep(2);
      } else {
        setError(data.reasoning ?? "Fant ingen forslag");
      }
    }
  } catch {
    setError("Noe gikk galt, prøv igjen");
  } finally {
    setLoading(false);
  }
}
```
Kjøper-modus: kaller `/api/search` og lagrer `filters` (til chips) og `results` (til `ListingCard`-grid) rett fra svaret.

Selger-modus: kaller `/api/price-suggestion`. Hvis den fant et prisintervall (`data.priceRange` finnes — husk fra del 5 at dette er `null` når det ikke fantes sammenligningsgrunnlag), bygges `draft`-objektet opp med `?? ""`-fallbacks (i tilfelle AI-et ikke klarte å tolke merke/modell), og brukeren føres videre til `step 2`. Hvis intervallet er `null`, vises i stedet feilmeldingen fra `reasoning` direkte til brukeren — samme "ikke gjett i blinde"-prinsipp fra API-siden reflekteres altså helt ut i UI-et.

`try/catch/finally` fanger nettverksfeil (f.eks. om serveren er nede) uavhengig av modus, og `finally` garanterer at `loading` alltid skrus av igjen, uansett utfall.

### `GenerateDescription.tsx` — hvorfor skilt ut som egen komponent?

Denne komponenten eier **step 3** av selger-flyten: generere en annonsetekst med AI, la brukeren redigere den, og til slutt publisere annonsen (kalle `POST /api/listings`, deretter `router.push` til den nye annonsesiden). Den er bevisst skilt ut fra `Hero.tsx` av et par grunner du bør kunne begrunne:

1. **Single responsibility.** `Hero.tsx` er allerede stor og håndterer to hele brukerflyter (se forrige seksjon). Å legge enda et eget API-kall (`generateDescription`) og enda en handling (`publish`) inn i den samme filen ville gjort den enda tyngre å lese og teste.
2. **Denne biten har sin egen, uavhengige lille state** (`description`, `loading`) som kun gjelder step 3 — den trenger ikke vite noe om `mode`, `filters`, `images` eller noen av de andre ti state-variablene i `Hero.tsx`. Ved å gi den et eget, smalt prop-interface (`{ draft, onPublish }`) blir avhengighetene eksplisitte og lette å følge.
3. **`onPublish`-callback-mønsteret**: `GenerateDescription` vet ingenting om *hvordan* forelderen skal nullstille seg selv etter publisering — den bare sier "jeg er ferdig" ved å kalle `onPublish()`, og `Hero.tsx` bestemmer selv hva som skal skje (`setStep(1); setDraft(null); setInput(""); setImages([])`). Dette er standard React-mønster for "barn-til-forelder"-kommunikasjon: barnet kan ikke sette forelderens state direkte, så det kalles en funksjon forelderen ga det.

Inni komponenten: `generateDescription()` kaller `/api/generate-description` og fyller `description`-state med svaret (som brukeren fortsatt kan redigere manuelt i `<textarea>` etterpå — AI-forslaget er et utgangspunkt, ikke et pålegg). `publish()` sender det ferdige objektet til `/api/listings` (merk `Number(draft.price)` — prisen kan ha kommet fra et tekst-input-felt i step 2 og må tvinges til tall før den sendes) og navigerer til den nyopprettede annonsen.

### De andre frontend-filene, kort

- **`ListingCard.tsx`** — gjenbrukbar kortkomponent for én annonse (bilde eller fallback med forbokstav i en terrakotta-boks, tittel, merke/modell/tilstand, pris, og — hvis den finnes — AI-begrunnelsen fra søket). Brukes både i søkeresultat-gridet og i "Våre anbefalinger".
- **`page.tsx`** (forsiden) — trivielt tynn, rendrer bare `<Hero />`. Typisk Next.js-mønster: siden er en tynn wrapper, all logikk bor i komponenten.
- **`layout.tsx`** — fortsatt i stor grad `create-next-app`-standard (font-oppsett med Geist, `<title>` er fortsatt "Create Next App") — et tegn på at metadata/branding ikke er prioritert ennå med fristen så nær, helt fair å nevne som "gjenstår".
- **`opprett/page.tsx`** — en helt manuell, AI-fri "Legg ut annonse"-side med et vanlig kontrollert skjema (`useState` for hele `form`-objektet, én `updateField`-funksjon som oppdaterer ett felt om gangen via computed property name `{ ...prev, [field]: value }`). Dette er den "kjedelige" fallback-veien for å opprette en annonse uten å gå via selger-AI-flyten på forsiden — nyttig å ha som kontrast når du forklarer AI-flyten: samme sluttresultat (en rad i `Listing`-tabellen), men uten AI-assistanse underveis.
- **`annonse/[id]/page.tsx`** — en **server component** (ingen `"use client"`, ingen `useState`) som henter annonsen direkte med `prisma.listing.findUnique` under rendering på serveren, inkludert selgerens `email`/`name` via `include: { seller: {...} }`. Kaller `notFound()` (Next.js sin innebygde 404-håndtering) hvis annonsen ikke finnes. "Kontakt selger"-knappen er en enkel `mailto:`-lenke — ingen innebygd meldingsfunksjon, bevisst holdt enkelt.
- **`logg-inn/page.tsx`** og **`registrer/page.tsx`** — fungerende, men helt ustylte skjemaer (ingen `style`/`className` i det hele tatt, i sterk kontrast til resten av appens gjennomførte terrakotta-design). Dette er tydelig ikke ferdigstilt visuelt ennå — grei ærlig ting å si i et intervju: "autentisering fungerer end-to-end, men jeg har ikke rukket å style de sidene."

---

## 7. Arkitekturen som helhet: fra søkefelt til resultater

Her er hele reisen, steg for steg, fra brukeren skriver noe i søkefeltet på forsiden til resultater vises — kjøper-flyten (den mest komplette AI-flyten):

1. **Brukeren laster `/`.** Next.js server-rendrer `page.tsx`, som rendrer `<Hero />`. `mode` starter som `"kjop"`.
2. **Brukeren skriver fritekst** i input-feltet (f.eks. "billig Samsung med god batteritid") — hver tastetrykk oppdaterer `input`-state via `onChange`.
3. **Brukeren klikker "Se forslag"** → skjemaets `onSubmit` trigger `handleSubmit(e)` i `Hero.tsx`. `e.preventDefault()` stopper vanlig side-reload. UI-tilstand nullstilles, `loading` settes til `true` (vises som "Henter...").
4. **Frontend gjør et `fetch("/api/search", { method: "POST", body: { query } })`.** Dette treffer Route Handleren i `src/app/api/search/route.ts`, kjørt på serveren (kan være Vercel sin serverless-infrastruktur, eller lokal `next dev`-server).
5. **Server: Kall 1 til Anthropic.** Route handleren sender fritekstsøket til `claude-sonnet-4-6` med en streng system-prompt som ber om ren JSON, og ber om strukturerte filtre (`budget`, `brand`, `priorities`).
6. **Server: parse LLM-svaret.** `parseJson()` renser eventuelle markdown-kodeblokk-markører og `JSON.parse`-er responsen til et `filters`-objekt (faller trygt tilbake på `{}` ved parse-feil).
7. **Server: database-query via Prisma.** `filters` brukes til å bygge et `prisma.listing.findMany({ where: {...} })`-kall mot Neon-databasen (gjennom `lib/prisma.ts`, som via `PrismaPg`-adapteren snakker faktisk SQL mot Postgres). Kun aktive annonser (`status: "AKTIV"`), maks 10 stk.
8. **Server: Kall 2 til Anthropic** (hvis det finnes treff) — sender søket + de faktiske databasetreffene til Claude, ber om en kort begrunnelse per annonse-id.
9. **Server: kombinér.** Begrunnelsene matches tilbake på annonsene via `id`, og hele `{ filters, results }`-objektet serialiseres til JSON og sendes tilbake som HTTP-respons.
10. **Frontend: motta og rendre.** `Hero.tsx` sin `handleSubmit` mottar responsen, kaller `setFilters(data.filters)` og `setResults(data.results)`. React rendrer på nytt: filter-chipsene vises øverst (budsjett/merke/prioriteringer som små terrakotta-pillede badges), og `results.map(...)` rendrer et `ListingCard` per treff i et responsivt grid, hver med sin AI-genererte begrunnelse.
11. **`loading` settes til `false`** i `finally`-blokken, og "Henter..."-teksten forsvinner.
12. **Brukeren klikker på et kort** → `ListingCard` er en `<Link href="/annonse/[id]">`, som navigerer (client-side, ingen full reload) til annonsedetaljsiden. Der kjører `annonse/[id]/page.tsx` som en server component, henter annonsen (inkl. selgerinfo) direkte fra Prisma under server-rendering, og viser full detaljvisning med en `mailto:`-kontaktknapp.

**Selger-flyten** følger samme skjelett, men med to LLM-kall i `/api/price-suggestion` (tolk beskrivelse → hent lignende annonser → foreslå prisintervall), deretter en egen tre-stegs UI-tilstandsmaskin i `Hero.tsx` (`step 1 → 2 → 3`) som til slutt lander i `GenerateDescription.tsx` sitt `publish()`-kall mot `POST /api/listings` — som igjen krever en gyldig NextAuth-sesjon (JWT-cookie) for å vite *hvem* som eier den nyopprettede annonsen.

**Tverrgående system-lag som er med i hvert eneste steg**, verdt å kunne peke på i et helhetsbilde:
- **Neon** (Postgres) er datalaget alt til slutt bunner ut i, med branch-basert isolasjon mellom miljøer (`neon.ts`).
- **Prisma** er oversetteren mellom TypeScript og SQL, typet gjennom hele kjeden fra `schema.prisma` til `src/generated/prisma` til `lib/prisma.ts`.
- **NextAuth/JWT** avgjør *hvem* som får lov til å skrive til databasen (kjøper-søk er åpent for alle, publisering krever innlogging).
- **Anthropic Claude** brukes konsekvent i et to-stegs "tolk fritekst → hent ekte data → begrunn/foreslå basert på ekte data"-mønster, aldri til å gjette et svar uten et databasegrunnlag å stå på.
