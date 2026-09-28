# KODE.md — linje-for-linje-gjennomgang

Dette dokumentet viser det faktiske innholdet i de viktigste filene i Rephone, med forklaringer rett under hver kodeblokk. Skrevet for deg som frontend-utvikler med begrenset backend-bakgrunn — fokus på *hva* hver linje gjør og *hvorfor* den er skrevet slik.

---

## `prisma/schema.prisma`

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Get a free hosted Postgres database in seconds: `npx create-db`

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Condition {
  NY
  PENT_BRUKT
  BRUKT
  GODT_BRUKT
}

enum ListingStatus {
  AKTIV
  SOLGT
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  createdAt    DateTime  @default(now())
  listings     Listing[]
}

model Listing {
  id          String        @id @default(cuid())
  title       String
  brand       String
  model       String
  condition   Condition
  price       Int
  description String
  imageUrl    String?
  status      ListingStatus @default(AKTIV)
  createdAt   DateTime      @default(now())
  sellerId    String
  seller      User          @relation(fields: [sellerId], references: [id])
}
```

**Linje 6–9, `generator client`**: forteller Prisma CLI-et *hva* det skal generere når du kjører `prisma generate`. `provider = "prisma-client"` er Prisma 7 sin nye generator (erstatter det gamle `prisma-client-js` — pass på hvis du googler gamle guider, de viser feil syntaks). `output = "../src/generated/prisma"` sier hvor den ferdige, typede TypeScript-klienten skal legges — altså inn i prosjektets egen `src/`-mappe, ikke gjemt inne i `node_modules` slik eldre Prisma-versjoner gjorde.

**Linje 11–13, `datasource db`**: sier at databasen er `postgresql`. Legg merke til at det **ikke** står noen `url = ...` her — det er fordi Prisma 7 lar deg flytte selve URL-en ut til `prisma7.config.ts` i stedet (se den filen lenger ned). Skjemaet bryr seg kun om *hvilken type* database det er, ikke hvor den ligger.

**Linje 15–20, `enum Condition`**: en lukket liste med gyldige tilstander en telefon kan ha. Fordelen med enum fremfor en fri tekststreng er at Postgres selv håndhever at `condition` aldri kan inneholde noe annet enn disse fire verdiene — feil kan ikke slippe forbi API-et og inn i databasen.

**Linje 22–25, `enum ListingStatus`**: samme prinsipp, brukes til å skille aktive annonser (`AKTIV`) fra solgte (`SOLGT`) — se hvordan `status: "AKTIV"` filtreres på i nesten alle `findMany`-kall senere i dette dokumentet.

**Linje 27–34, `model User`**:
- `id String @id @default(cuid())` — primærnøkkel. `cuid()` genererer en kollisjonssikker, sorterbar unik streng-ID automatisk ved opprettelse (i stedet for at du selv må sette en ID, eller stole på et enkelt auto-increment-tall).
- `email String @unique` — Postgres håndhever på databasenivå at ingen to brukere kan ha samme e-post. Dette er grunnen til at `prisma.user.findUnique({ where: { email } })` er lovlig i `auth.ts` — `findUnique` krever et felt merket `@unique` eller `@id`.
- `passwordHash String` — bevisst navngitt `passwordHash`, ikke `password`, som et lite signal i koden om at dette *aldri* er klartekst (se `src/auth.ts` for selve hashingen).
- `createdAt DateTime @default(now())` — settes automatisk av Prisma/Postgres ved opprettelse, du trenger aldri sette denne selv i kode.
- `listings Listing[]` — dette er **ikke** en kolonne i databasen. Det er en virtuell relasjon Prisma bruker for å la deg skrive `user.listings` i TypeScript-koden; selve koblingen ligger fysisk i `Listing.sellerId`.

**Linje 36–49, `model Listing`**:
- `imageUrl String?` — `?` betyr valgfritt/nullable. Derfor sjekker `ListingCard.tsx` og `annonse/[id]/page.tsx` alltid `listing.imageUrl ? ... : <fallback>`.
- `status ListingStatus @default(AKTIV)` — enhver nyopprettet annonse er `AKTIV` med mindre noe eksplisitt setter den til `SOLGT` via `PATCH`.
- `sellerId String` + `seller User @relation(fields: [sellerId], references: [id])` — dette er selve foreign key-en. `sellerId` er den faktiske kolonnen i `Listing`-tabellen (en streng som peker på en `User.id`), mens `seller`-feltet er Prisma sin måte å la deg skrive `listing.seller.name` i TypeScript i stedet for å manuelt gjøre en ekstra spørring.

---

## `src/lib/prisma.ts`

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Linje 1**: importerer den *genererte* Prisma-klienten — altså koden som `prisma generate` faktisk skrev ut til `src/generated/prisma/`, ikke noe som kommer direkte fra `node_modules`. Dette er hvorfor `schema.prisma` peker `output` dit.

**Linje 2**: `PrismaPg` er driver-adapteren som kobler Prisma-klienten til `pg`-pakken, den faktiske lavnivå-Postgres-driveren for Node.js. I Prisma 7 er dette **påkrevd** — klienten kan ikke koble seg til noen database uten en eksplisitt adapter, i motsetning til eldre Prisma-versjoner der tilkoblingen var innebygd.

**Linje 4**: oppretter selve adapteren, med connection-stringen hentet fra miljøvariabelen `DATABASE_URL` (satt i `.env`, som igjen kommer fra Neon).

**Linje 6**: `globalThis` er det globale objektet i Node.js (tilsvarer `window` i nettleseren). Her "juksekastes" det til en type med et `prisma`-felt, slik at TypeScript tillater deg å lese/skrive `globalForPrisma.prisma` uten feil.

**Linje 8**: kjernen i mønsteret — `globalForPrisma.prisma || new PrismaClient({ adapter })`. Hvis det allerede finnes en klient lagret globalt, gjenbruk den; ellers lag en ny (med adapteren fra linje 4).

**Linje 10**: kun i utvikling (`NODE_ENV !== "production"`) lagres klienten på `globalThis`, slik at den overlever Next.js sine hot reloads under `next dev`. Uten dette ville hver kodeendring under utvikling laget en helt ny `PrismaClient` — og dermed en ny tilkoblingspool mot Postgres — inntil du går tom for tillatte tilkoblinger. I produksjon skjer ikke hot reload, så der er det trygt (og riktig) at hver serverinstans får sin egen klient uten global caching.

---

## `src/auth.ts`

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
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
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/logg-inn",
  },
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
});
```

**Linje 6**: `NextAuth({...})` er en fabrikkfunksjon — du gir den én stor konfigurasjon, og den returnerer et objekt med de fire verktøyene appen trenger: `handlers` (brukes i Route Handler-en for `/api/auth/*`), `auth` (kalles server-side for å lese innlogget bruker), og `signIn`/`signOut` (kalles fra klient-komponenter).

**Linje 8–26, `Credentials({...})`**: dette er selve **provideren** — måten brukeren logger inn på. Credentials betyr e-post+passord, i motsetning til f.eks. Google-OAuth.

**Linje 9–12, `credentials: { email: {}, password: {} }`**: definerer *hvilke felt* innloggingsskjemaet forventer. De tomme objektene er nok her siden vi bygger vårt eget skjema i `logg-inn/page.tsx` i stedet for å bruke NextAuth sin auto-genererte HTML-side.

**Linje 13, `authorize: async (credentials) => {`**: dette er selve innloggings-logikken — kjøres hver gang noen prøver å logge inn. Returverdien avgjør om innloggingen lykkes.

**Linje 14–15**: henter ut `email`/`password` fra `credentials`-objektet og typer dem eksplisitt som `string` (NextAuth sine typer er løsere/mer generiske her).

**Linje 16, `if (!email || !password) return null;`**: mangler noen av feltene, avbryt umiddelbart. `null` er NextAuth sin konvensjon for "innlogging feilet" — ingen detaljer gis om *hvorfor*.

**Linje 18, `prisma.user.findUnique({ where: { email } })`**: slår opp brukeren i databasen på e-post. Dette fungerer kun fordi `email` er markert `@unique` i `schema.prisma`.

**Linje 19, `if (!user) return null;`**: finnes ikke brukeren, feil — men **samme** `null`-retur som ved feil passord (linje 22). Dette er bevisst: gir du forskjellig feilmelding for "bruker finnes ikke" vs. "feil passord", kan en angriper bruke innloggingsskjemaet til å kartlegge hvilke e-poster som er registrert (user enumeration). Her skjules det.

**Linje 21, `bcrypt.compare(password, user.passwordHash)`**: sammenligner det innsendte (klartekst) passordet mot den lagrede hashen. `bcrypt.compare` vet selv hvordan den skal hashe input på nytt med samme salt som ligger kodet inn i `user.passwordHash`, og sammenligne resultatene — du trenger aldri "dekryptere" noe (det går ikke, bcrypt er enveis).

**Linje 24, `return { id: user.id, email: user.email, name: user.name };`**: dette objektet blir input til `jwt`-callbacken rett under (som `user`-parameteret der). Merk at `passwordHash` bevisst **ikke** er med her — den skal aldri forlate serveren.

**Linje 28, `session: { strategy: "jwt" }`**: sier at sesjonen lagres som en signert/kryptert cookie (JWT) i nettleseren, ikke som en rad i en database-tabell. Det finnes ingen `Session`-modell i `schema.prisma` — det trengs ikke med denne strategien.

**Linje 29–31, `pages: { signIn: "/logg-inn" }`**: overstyrer NextAuth sin standard, auto-genererte innloggingsside med vår egen route (`src/app/logg-inn/page.tsx`).

**Linje 33–36, `jwt({ token, user })`**: kjører hver gang et JWT opprettes/oppdateres. `user` er kun til stede rett etter en vellykket `authorize`-kjøring. `if (user) token.id = user.id;` — kopierer bruker-ID-en *inn i* selve token-innholdet, slik at den overlever videre (siden vi ikke slår opp i databasen ved hver request når vi bruker JWT-strategi).

**Linje 37–40, `session({ session, token })`**: kjører hver gang koden leser sesjonen (f.eks. via `auth()`). Leser `id`-en *tilbake ut* av tokenet og legger den på `session.user.id`. Uten denne callbacken ville `session.user.id` alltid vært `undefined`, og API-rutenes eierskaps-sjekker (se `listings/[id]/route.ts` under) ville vært umulige.

---

## `src/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**Linje 1**: importerer `handlers`-objektet som ble bygget i `src/auth.ts`.

**Linje 2**: plukker ut `GET` og `POST` fra det objektet og re-eksporterer dem som navngitte funksjoner — akkurat det Next.js sin Route Handler-konvensjon krever (en fil som eksporterer funksjoner navngitt etter HTTP-metoder). Filnavnet `[...nextauth]` er en **catch-all dynamic route**: `[...noe]` fanger opp *alle* under-URL-er, så denne ene filen svarer på `/api/auth/signin`, `/api/auth/session`, `/api/auth/csrf` osv. — NextAuth avgjør internt hva som skal skje basert på selve URL-en.

---

## `src/app/api/register/route.ts`

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Mangler felt" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "E-post er allerede registrert" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
```

**Linje 5, `export async function POST(req: Request)`**: navnet `POST` er selve konvensjonen — Next.js kaller denne funksjonen automatisk når noen sender en HTTP POST til `/api/register`. `req: Request` er nettleser-standardens `Request`-objekt (samme type du finner i vanlig `fetch`-API, ikke noe Next.js-spesifikt).

**Linje 6, `await req.json()`**: leser og parser JSON-bodyen fra requesten. `await` trengs fordi det å lese en request-body er en asynkron strøm-operasjon.

**Linje 8–10**: enkel validering — mangler ett av de tre feltene, svar med `400 Bad Request` og en norsk feilmelding som frontend viser direkte til brukeren.

**Linje 12–18**: sjekker om e-posten allerede finnes i databasen *før* man prøver å opprette noe. Dette gir en tydelig feilmelding i stedet for at Postgres sin `@unique`-constraint kaster en rå databasefeil lenger nede.

**Linje 20, `bcrypt.hash(password, 10)`**: hasher passordet med 10 **salt rounds** før det noensinne lagres. `10` er en avveining mellom sikkerhet (høyere = tregere å brute-force) og ytelse (høyere = tregere for hver ekte innlogging/registrering).

**Linje 22–24, `prisma.user.create({ data: {...} })`**: oppretter selve raden i `User`-tabellen. Legg merke til at det er `passwordHash` (den hashede verdien), ikke det opprinnelige `password`, som lagres.

**Linje 26, returverdien**: returnerer kun `id` og `email` — **aldri** `passwordHash` tilbake i responsen, selv om `user`-objektet fra Prisma inneholder det. Dette er en bevisst "velg ut kun det du trenger"-praksis for å unngå å eksponere sensitive felt ved et uhell.

---

## `src/app/api/listings/route.ts`

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: "AKTIV" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const { title, brand, model, condition, price, description, imageUrl } =
    await req.json();

  if (!title || !brand || !model || !condition || !price || !description) {
    return NextResponse.json({ error: "Mangler felt" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      title,
      brand,
      model,
      condition,
      price,
      description,
      imageUrl,
      sellerId: session.user.id,
    },
  });

  return NextResponse.json(listing);
}
```

**Linje 5–11, `GET()`**: helt åpent endepunkt, ingen `auth()`-sjekk i det hele tatt — hvem som helst kan hente listen med annonser. `where: { status: "AKTIV" }` gjemmer automatisk bort solgte annonser fra hovedlisten, uten at frontend selv trenger å filtrere dem bort. `orderBy: { createdAt: "desc" }` sorterer nyeste først.

**Linje 13, `export async function POST(req: Request)`**: samme fil kan ha flere eksporterte HTTP-metode-funksjoner — `GET` og `POST` lever side om side, og Next.js ruter automatisk til riktig én basert på hvilken HTTP-metode requesten faktisk bruker.

**Linje 14–20**: `await auth()` henter sesjonen server-side (leser og validerer JWT-cookien). `session?.user?.id` bruker **optional chaining** — hvis `session` er `null` (ikke innlogget), eller `session.user` mangler, evaluerer hele uttrykket trygt til `undefined` i stedet for å kaste en feil. Er brukeren ikke innlogget, svares det med `401 Unauthorized`.

**Linje 22–23**: destrukturerer de forventede feltene rett ut av JSON-bodyen.

**Linje 25–27**: validerer at alle påkrevde felt er sendt med (merk: `imageUrl` er *ikke* i denne listen — den er valgfri, akkurat som `String?` i skjemaet tilsier).

**Linje 29–40, `prisma.listing.create({...})`**: oppretter selve annonsen. Det viktigste å legge merke til: `sellerId: session.user.id` — denne verdien kommer **kun** fra den serververifiserte sesjonen, aldri fra noe klienten selv sender inn i body-en. Dette hindrer at noen kunne sende `{ ..., sellerId: "noen-andres-id" }` og late som en annen bruker eier annonsen.

---

## `src/app/api/listings/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }

  if (existing.sellerId !== session.user.id) {
    return NextResponse.json(
      { error: "Du eier ikke denne annonsen" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const {
    title,
    brand,
    model,
    condition,
    price,
    description,
    imageUrl,
    status,
  } = body;

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title,
      brand,
      model,
      condition,
      price,
      description,
      imageUrl,
      status,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }

  if (existing.sellerId !== session.user.id) {
    return NextResponse.json(
      { error: "Du eier ikke denne annonsen" },
      { status: 403 },
    );
  }

  await prisma.listing.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

**Linje 6–7, `{ params }: { params: Promise<{ id: string }> }`**: i nyere Next.js (App Router) er `params` en **Promise**, ikke et vanlig objekt — derfor må du `await params` (linje 9) før du kan bruke `id`. Dette er en av de "brytende endringene" som skiller denne Next.js-versjonen fra eldre opplæringsmateriale.

**Linje 9–15, `GET`**: enkelt oppslag på `id` via `findUnique`. Finnes annonsen ikke, `404 Not Found` med en norsk feilmelding i stedet for å returnere `null` og la frontend krasje på det.

**Linje 23–29, starten av `PATCH`**: identisk innloggings-sjekk som i `listings/route.ts` sin `POST` — `401` hvis ingen gyldig sesjon.

**Linje 31–37**: henter den *eksisterende* annonsen fra databasen (ikke bare det klienten sendte inn) — nødvendig for å kunne sjekke eierskap i neste steg, og for å gi `404` hvis ID-en ikke finnes i det hele tatt.

**Linje 39–43, `if (existing.sellerId !== session.user.id) return 403`**: dette er **eierskaps-sjekken** — kjernen i hvorfor `session.user.id` måtte kobles gjennom JWT-callbacken i `auth.ts`. `403 Forbidden` betyr "jeg vet hvem du er, men du har ikke lov til dette" — forskjellig fra `401` som betyr "jeg vet ikke hvem du er i det hele tatt".

**Linje 45–68**: leser oppdateringsfeltene fra body og kaller `prisma.listing.update`. Merk: her er det **ingen** validering av at feltene faktisk finnes (i motsetning til `POST` i `listings/route.ts`) — sender du `undefined` for et felt, vil Prisma la den eksisterende databaseverdien stå urørt for de feltene (siden `data: { title: undefined }` ignoreres av Prisma), men dette er en litt implisitt oppførsel verdt å være obs på.

**`DELETE`-funksjonen (linje 74–103)**: nøyaktig samme mønster som `PATCH` — innlogging-sjekk, hent eksisterende, eierskaps-sjekk — før selve `prisma.listing.delete({ where: { id } })` kjøres og `{ success: true }` returneres.

---

## `src/app/api/search/route.ts`

```ts
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) {
    return NextResponse.json({ error: "Mangler søk" }, { status: 400 });
  }

  // Kall 1: fritekst -> strukturerte filtre
  const parseResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system:
      "Du tolker norske fritekst-søk etter brukte telefoner til JSON. Svar KUN med JSON, ingen annen tekst.",
    messages: [
      {
        role: "user",
        content: `Tolk søket til JSON med feltene: budget (tall eller null), brand ("Apple", "Samsung" osv, eller null), priorities (liste med strenger, f.eks ["batteri", "kamera"]).\n\nSøk: "${query}"`,
      },
    ],
  });

  const parseBlock = parseResponse.content[0];
  const filters =
    parseBlock.type === "text" ? (parseJson(parseBlock.text) ?? {}) : {};

  // Steg 2: query mot databasen basert på filtrene
  const listings = await prisma.listing.findMany({
    where: {
      status: "AKTIV",
      ...(filters.budget ? { price: { lte: filters.budget } } : {}),
      ...(filters.brand
        ? { brand: { equals: filters.brand, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (listings.length === 0) {
    return NextResponse.json({ filters, results: [] });
  }

  // Kall 2: treff + søk -> kort begrunnelse per annonse
  const reasoningResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system:
      "Du skriver en kort norsk begrunnelse (maks 15 ord) for hvorfor hver annonse passer søket. Svar KUN med JSON: array av { id, reason }.",
    messages: [
      {
        role: "user",
        content: `Søk: "${query}"\n\nAnnonser:\n${JSON.stringify(
          listings.map((l) => ({
            id: l.id,
            title: l.title,
            brand: l.brand,
            model: l.model,
            price: l.price,
            condition: l.condition,
          })),
        )}`,
      },
    ],
  });

  const reasoningBlock = reasoningResponse.content[0];
  const reasons: { id: string; reason: string }[] =
    reasoningBlock.type === "text"
      ? (parseJson(reasoningBlock.text) ?? [])
      : [];

  const results = listings.map((listing) => ({
    ...listing,
    reason: reasons.find((r) => r.id === listing.id)?.reason ?? "",
  }));

  return NextResponse.json({ filters, results });
}
```

**Linje 5, `const anthropic = new Anthropic();`**: opprettes én gang på modul-nivå (ikke inni `POST`-funksjonen), gjenbrukt for alle requester til dette endepunktet. Leser automatisk `ANTHROPIC_API_KEY` fra miljøvariablene, ingen eksplisitt config nødvendig.

**Linje 7–14, `parseJson`**: en liten hjelpefunksjon som brukes flere steder i filen. `text.replace(/\`\`\`json|\`\`\`/g, "")` fjerner markdown-kodeblokk-markører som Claude noen ganger legger rundt JSON-svar selv når man ber om ren JSON. `try/catch` rundt `JSON.parse` gjør at en uventet/ødelagt respons fra LLM-et returnerer `null` i stedet for å krasje hele requesten.

**Linje 17–20, starten av `POST`**: leser `query` fra body, avviser tomme søk med `400`.

**Linje 23–34, kall 1 til Anthropic**: `system`-prompten instruerer modellen strengt til å *kun* svare med JSON (viktig, siden svaret parses maskinelt rett etter). Brukerens fritekst limes inn i `content`-strengen via template literal. `model: "claude-sonnet-4-6"` — merk at dette *ikke* er Haiku, i motsetning til de andre AI-endepunktene i prosjektet.

**Linje 36–38**: `parseResponse.content[0]` — Anthropic sitt svar er en liste av "content blocks" (kan i prinsippet være flere typer innhold, f.eks. tool-bruk); her plukkes første blokk. `parseBlock.type === "text"` er en **type guard** — TypeScript vet ikke at blokken har et `.text`-felt før du har sjekket `type`-feltet eksplisitt. `?? {}` sikrer et tomt filterobjekt hvis parsingen feiler, i stedet for `null`.

**Linje 41–50, database-queryen**: `...(filters.budget ? { price: { lte: filters.budget } } : {})` er et **conditional spread**-mønster: hvis `filters.budget` finnes, spres `{ price: { lte: ... } }` inn i `where`-objektet; hvis ikke, spres et tomt objekt inn (ingen effekt på queryen). Samme mønster for `brand`, med `mode: "insensitive"` for å matche uansett store/små bokstaver. `take: 10` setter en øvre grense på antall resultater.

**Linje 53–55**: hvis ingen treff, returner tidlig — ingen vits i å be Claude begrunne et tomt resultatsett (sparer et helt API-kall og litt penger/tid).

**Linje 58–78, kall 2 til Anthropic**: sender *både* det opprinnelige søket *og* de faktiske databasetreffene (kun de feltene som trengs — ikke hele Prisma-objektet, som ville inkludert ting som `sellerId` unødvendig) tilbake til Claude, og ber om en kort begrunnelse per `id`.

**Linje 80–89, kobling av resultat**: `reasons.find((r) => r.id === listing.id)?.reason ?? ""` — for hver annonse, let etter en matchende begrunnelse via `id`; `?.` håndterer tilfellet der `find` ikke gir treff (returnerer `undefined`), og `?? ""` gir en tom streng som siste fallback i stedet for `undefined` i UI-et.

---

## `src/app/api/price-suggestion/route.ts`

```ts
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  const { description } = await req.json();
  if (!description) {
    return NextResponse.json({ error: "Mangler beskrivelse" }, { status: 400 });
  }

  // Kall 1: fritekst -> merke, modell, tilstand
  const parseResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      'Du tolker norske beskrivelser av brukte telefoner til JSON. Felt: brand (f.eks "Apple", "Samsung"), model (f.eks "iPhone 13"), condition (ett av: NY, PENT_BRUKT, BRUKT, GODT_BRUKT, eller null hvis uklart). Svar KUN med JSON.',
    messages: [{ role: "user", content: description }],
  });

  const parseBlock = parseResponse.content[0];
  const parsed = parseBlock.type === "text" ? parseJson(parseBlock.text) : {};

  // Steg 2: hent lignende annonser fra databasen
  const similar = await prisma.listing.findMany({
    where: {
      status: "AKTIV",
      ...(parsed.brand
        ? { brand: { equals: parsed.brand, mode: "insensitive" } }
        : {}),
      ...(parsed.model
        ? { model: { contains: parsed.model, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Ingen sammenligningsgrunnlag, ikke la AI-en gjette i blinde
  if (similar.length === 0) {
    return NextResponse.json({
      parsed,
      priceRange: null,
      reasoning:
        "Fant ingen sammenlignbare annonser i databasen ennå, for tidlig å foreslå en pris.",
    });
  }

  // Kall 2: beskrivelse + lignende annonser -> prisintervall med begrunnelse
  const suggestResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      "Du foreslår et prisintervall i norske kroner for en brukt telefon, basert på lignende annonser. Svar KUN med JSON: { low, high, reasoning } der reasoning er maks 20 ord på norsk.",
    messages: [
      {
        role: "user",
        content: `Beskrivelse av telefonen som skal selges: "${description}"\n\nLignende annonser i databasen:\n${JSON.stringify(
          similar.map((l) => ({
            model: l.model,
            condition: l.condition,
            price: l.price,
          })),
        )}`,
      },
    ],
  });

  const suggestBlock = suggestResponse.content[0];
  const suggestion =
    suggestBlock.type === "text" ? parseJson(suggestBlock.text) : {};

  return NextResponse.json({
    parsed,
    priceRange: { low: suggestion.low, high: suggestion.high },
    reasoning: suggestion.reasoning,
  });
}
```

**Linje 7–10, `parseJson` her**: merk at denne varianten (i motsetning til den i `search/route.ts`) **ikke** har `try/catch` — `JSON.parse(cleaned)` vil kaste en feil rett ut hvis Claude sitt svar ikke er gyldig JSON. Det finnes ingen global feilhåndtering i denne ruten heller, så en ødelagt LLM-respons her ville gitt brukeren en rå `500`-feil i stedet for en pen norsk feilmelding — en liten inkonsistens sammenlignet med `search/route.ts`, verdt å nevne som forbedringspotensial.

**Linje 19–25, kall 1**: `model: "claude-haiku-4-5"` — her *er* det den billige/raske modellen som brukes, siden oppgaven (tolk kort tekst til tre felt) er godt innenfor det en liten modell takler presist. `messages: [{ role: "user", content: description }]` — her sendes hele beskrivelsen rett inn som brukermelding, uten noen ekstra prompt-tekst rundt (instruksen ligger i sin helhet i `system`).

**Linje 27–28**: samme mønster som i `search/route.ts`, men uten `?? {}`-fallback — hvis `parseBlock.type !== "text"`, blir `parsed` et tomt objekt `{}`, men hvis parsingen *kaster en feil* (ugyldig JSON), stopper hele requesten der med en uhåndtert feil.

**Linje 31–43, `similar`-queryen**: samme conditional-spread-mønster som i `search`, men her brukes `contains` på `model` (linje 38) i stedet for `equals` — bevisst valg siden modellnavn er mindre standardiserte enn merkenavn (f.eks. "iPhone 13" kontra "iPhone 13 Pro"), så et delvis strengmatch gir flere relevante treff enn et eksakt.

**Linje 45–52, den tomme-treff-håndteringen**: dette er den viktigste linjen i hele filen å kunne forklare i et intervju. I stedet for å la Claude gjette et prisintervall uten noe faktisk sammenligningsgrunnlag (som ville vært ren hallusinasjon), returneres et eksplisitt `priceRange: null` med en forklarende `reasoning`-tekst. Frontend (`Hero.tsx`) sjekker nettopp denne `null`-verdien for å vite om den skal vise et feil-varsel i stedet for et prisforslag.

**Linje 55–73, kall 2**: sender beskrivelsen *og* de faktiske lignende annonsene (kun `model`, `condition`, `price` — minimalt datasett) til Claude, og ber om et strengt strukturert `{ low, high, reasoning }`-svar.

**Linje 79–83, returverdien**: pakker responsen om til `{ parsed, priceRange: { low, high }, reasoning }` — et konsistent, forutsigbart skjema som `Hero.tsx` bygger sitt `draft`-objekt direkte fra.

---

## `src/app/api/generate-description/route.ts`

```ts
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { brand, model, condition, price } = await req.json();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      "Du skriver korte, ærlige annonsetekster for brukte telefoner på norsk. Maks 3 setninger. Ikke overselg. Ikke bruk utropstegn.",
    messages: [
      {
        role: "user",
        content: `Skriv en annonsetekst for: ${brand} ${model}, tilstand: ${condition}, pris: ${price}kr`,
      },
    ],
  });

  const block = response.content[0];
  const description = block.type === "text" ? block.text : "";
  return NextResponse.json({ description });
}
```

**Linje 2**: denne filen importerer *ikke* `prisma` — den eneste av AI-endepunktene som ikke snakker med databasen i det hele tatt, siden den kun jobber med data brukeren allerede har oppgitt/bekreftet i UI-et (fra `draft`-objektet i `Hero.tsx`).

**Linje 7, `const { brand, model, condition, price } = await req.json();`**: merk — **ingen validering** her (i motsetning til `register` og `listings`-rutene). Mangler ett av feltene, blir de bare `undefined` i prompten under (`Skriv en annonsetekst for: undefined undefined, ...`), noe som ville gitt et rart, men ikke krasjende, resultat. Et eksempel på at ikke alle ruter i prosjektet har like streng inputvalidering.

**Linje 12–13, `system`-prompten**: `"Ikke overselg. Ikke bruk utropstegn."` er en bevisst tone-instruks — typisk salgstekst-AI har en tendens til å overdrive ("🔥 KJEMPETILBUD!!!"), og dette er et konkret mottiltak skrevet rett inn i prompten.

**Linje 15–19, `content` template literal**: bygger én sammenhengende setning av strukturerte felt (`brand`, `model`, `condition`, `price`) til en naturlig-språk-instruks Claude kan jobbe videre på.

**Linje 22–23**: samme `content[0]`/`type === "text"`-mønster som i de andre AI-rutene, men her trengs ikke `parseJson` i det hele tatt — svaret *er* selve teksten, ikke JSON som skal parses. `: ""` som fallback sikrer at frontend alltid får en streng tilbake, aldri `undefined`.

---

## `src/components/Hero.tsx`

```tsx
"use client";

import { useState } from "react";
import ListingCard from "./ListingCard";
import GenerateDescription from "@/components/GenerateDescription";

type Mode = "kjop" | "selg";

type SearchResult = {
  id: string;
  title: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  reason?: string;
};

type Filters = {
  budget?: number;
  brand?: string;
  priorities?: string[];
};

export default function Hero() {
  const [mode, setMode] = useState<Mode>("kjop");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    low: number;
    high: number;
    reasoning: string;
  } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [draft, setDraft] = useState<{
    brand: string;
    model: string;
    condition: string;
    price: number;
    description: string;
    reasoning: string;
  } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setError("");
    setResults([]);
    setFilters(null);
    setPriceSuggestion(null);
    setLoading(true);

    try {
      if (mode === "kjop") {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        });
        const data = await res.json();
        setFilters(data.filters);
        setResults(data.results);
      } else {
        const res = await fetch("/api/price-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: input }),
        });
        const data = await res.json();
        if (data.priceRange) {
          setDraft({
            brand: data.parsed?.brand ?? "",
            model: data.parsed?.model ?? "",
            condition: data.parsed?.condition ?? "",
            price: data.priceRange.low,
            description: "",
            reasoning: data.reasoning ?? "",
          });
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

  async function handleShowRecommendations() {
    setError("");
    setFilters(null);
    setPriceSuggestion(null);
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setResults(data.slice(0, 6));
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 3));
  }

  return (
    <main
      style={{ background: "#FBF7F0", minHeight: "100vh" }}
      className="px-6 py-8"
    >
      <div className="flex justify-between items-center max-w-3xl mx-auto mb-10">
        <span style={{ color: "#3A2E22" }} className="text-lg font-medium">
          Rephone
        </span>
        <a href="/logg-inn" style={{ color: "#8A7A68" }} className="text-sm">
          Logg inn
        </a>
      </div>

      <div className="max-w-xl mx-auto text-center">
        <div className="flex gap-2 justify-center mb-4">
          <button
            type="button"
            onClick={() => setMode("kjop")}
            style={{
              background: mode === "kjop" ? "#C4622E" : "transparent",
              color: mode === "kjop" ? "#FBF7F0" : "#8A7A68",
              border: mode === "kjop" ? "none" : "1px dashed #C9A98D",
            }}
            className="px-4 py-1.5 rounded-full text-sm"
          >
            Kjøp
          </button>
          <button
            type="button"
            onClick={() => setMode("selg")}
            style={{
              background: mode === "selg" ? "#C4622E" : "transparent",
              color: mode === "selg" ? "#FBF7F0" : "#8A7A68",
              border: mode === "selg" ? "none" : "1px dashed #C9A98D",
            }}
            className="px-4 py-1.5 rounded-full text-sm"
          >
            Selg
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "kjop"
                ? "...hva trenger du?"
                : "...beskriv telefonen din"
            }
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="w-full rounded-full px-6 py-3 text-sm outline-none mb-4"
          />

          <div className="flex gap-2 justify-center">
            <button
              type="submit"
              style={{ border: "1px solid #C4622E", color: "#C4622E" }}
              className="px-4 py-1.5 rounded-full text-sm"
            >
              {mode === "kjop" ? "Se forslag" : "Se forslag til annonse"}
            </button>
            {mode === "kjop" && (
              <button
                type="button"
                onClick={handleShowRecommendations}
                style={{ border: "1px dashed #C9A98D", color: "#8A7A68" }}
                className="px-4 py-1.5 rounded-full text-sm"
              >
                Våre anbefalinger
              </button>
            )}
          </div>
          {mode === "selg" && (
            <div className="flex justify-center gap-3 mt-2 mb-4">
              {[0, 1, 2].map((i) => (
                <label
                  key={i}
                  style={{
                    width: 72,
                    height: 72,
                    background: "white",
                    border: "1px dashed #C9A98D",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#C9A98D",
                    fontSize: 24,
                    overflow: "hidden",
                  }}
                >
                  {images[i] ? (
                    <img
                      src={URL.createObjectURL(images[i])}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "+"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="max-w-3xl mx-auto mt-12">
        {loading && (
          <p style={{ color: "#8A7A68" }} className="text-center text-sm">
            Henter...
          </p>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {filters && (
          <div className="flex gap-2 justify-center flex-wrap mb-6">
            {filters.budget && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#F3DCD1", color: "#8A4A2E" }}
              >
                Budsjett: {filters.budget}kr
              </span>
            )}
            {filters.brand && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#F3DCD1", color: "#8A4A2E" }}
              >
                {filters.brand}
              </span>
            )}
            {filters.priorities?.map((p) => (
              <span
                key={p}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#F3DCD1", color: "#8A4A2E" }}
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {mode === "selg" && step === 2 && draft && (
          <div className="max-w-xl mx-auto mt-8">
            <div
              style={{
                background: "white",
                border: "1px solid #E9DCCB",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <p className="text-xs mb-4" style={{ color: "#8A7A68" }}>
                AI-forslag, juster det som ikke stemmer
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Merke", key: "brand" },
                  { label: "Modell", key: "model" },
                  { label: "Tilstand", key: "condition" },
                  { label: "Pris (kr)", key: "price" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <p className="text-xs mb-1" style={{ color: "#A69581" }}>
                      {label}
                    </p>
                    <input
                      value={String(draft[key as keyof typeof draft])}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, [key]: e.target.value } : null,
                        )
                      }
                      style={{
                        border: "1px solid #E9DCCB",
                        background: "#FBF7F0",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12,
                        width: "100%",
                        color: "#3A2E22",
                      }}
                    />
                  </div>
                ))}
                <div>
                  <p className="text-xs mb-1" style={{ color: "#A69581" }}>
                    Lagring
                  </p>
                  <input
                    placeholder="f.eks. 128GB"
                    style={{
                      border: "1px solid #E9DCCB",
                      background: "#FBF7F0",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      width: "100%",
                      color: "#3A2E22",
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "#A69581" }}>
                    Batterihelse
                  </p>
                  <input
                    placeholder="f.eks. 91%"
                    style={{
                      border: "1px solid #E9DCCB",
                      background: "#FBF7F0",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      width: "100%",
                      color: "#3A2E22",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  background: "#F3DCD1",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <p className="text-xs" style={{ color: "#8A4A2E" }}>
                  {draft.reasoning}
                </p>
                <p
                  className="text-lg font-medium mt-1"
                  style={{ color: "#C4622E" }}
                >
                  {draft.price.toLocaleString("no")} kr
                </p>
              </div>
              <button
                onClick={() => setStep(3)}
                style={{ background: "#C4622E", color: "#FBF7F0" }}
                className="w-full rounded-full py-2.5 text-sm"
              >
                Fortsett
              </button>
            </div>
          </div>
        )}

        {mode === "selg" && step === 3 && draft && (
          <div className="max-w-xl mx-auto mt-8">
            <div
              style={{
                background: "white",
                border: "1px solid #E9DCCB",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <GenerateDescription
                draft={draft}
                onPublish={() => {
                  setStep(1);
                  setDraft(null);
                  setInput("");
                  setImages([]);
                }}
              />
            </div>
          </div>
        )}

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {results.map((r) => (
            <ListingCard key={r.id} listing={r} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

**Linje 1, `"use client"`**: må stå øverst fordi denne filen bruker `useState` og hendelseshåndterere (`onClick`, `onChange`) — disse fungerer kun i **client components**, ikke i Next.js sine standard **server components**.

**Linje 7, `type Mode = "kjop" | "selg"`**: en **union type** — `mode` kan aldri være noe annet enn nøyaktig disse to strengene, noe TypeScript håndhever ved kompilering (skriv `setMode("selge")` et sted, og du får en kompileringsfeil).

**Linje 9–17, `type SearchResult`**: formen på ett søkeresultat, slik det kommer tilbake fra `/api/search`. `reason?: string` er valgfri fordi `ListingCard` også brukes til "Våre anbefalinger" (fra `/api/listings`), som ikke har noen AI-begrunnelse.

**Linje 26, `useState<Mode>("kjop")`**: appen starter alltid i kjøper-modus.

**Linje 27–29, `input`/`loading`/`error`**: delt UI-tilstand mellom begge flyter — samme søkefelt brukes til både "hva trenger du?" og "beskriv telefonen din", avhengig av `mode`.

**Linje 30–31, `filters`/`results`**: kjøper-flytens data — chipsene og selve søkeresultat-gridet.

**Linje 32–36, `priceSuggestion`**: deklarert og nullstilt flere steder (linje 55, 99), men **aldri lest** noe sted i JSX-en under. Prisforslaget vises i praksis via `draft.price`/`draft.reasoning` i step 2 i stedet. Dette er død/ubrukt state — trolig en rest fra en tidligere versjon av selger-flyten.

**Linje 37, `images: File[]`**: opptil 3 bildefiler valgt i selger-flyten. `File` er nettleserens innebygde type for en valgt fil.

**Linje 38–45, `draft`**: selger-flytens "kladd"-objekt — det AI foreslo (`brand`, `model`, `condition`, `price`, `reasoning`) pluss `description` som fylles ut senere i step 3. Dette er objektet som til slutt sendes til `/api/listings` i `GenerateDescription.tsx`.

**Linje 46, `step: 1 | 2 | 3`**: en enkel state machine for selger-flyten — literal union av tall, ikke en generell `number`, slik at ugyldige steg-verdier fanges av TypeScript.

**Linje 48–94, `handleSubmit`**:
- **Linje 49, `e.preventDefault()`**: hindrer nettleserens standard skjema-innsending (full side-reload).
- **Linje 50, `if (!input.trim()) return;`**: avviser tomt eller kun-whitespace input tidlig, før noe API-kall gjøres.
- **Linje 52–56**: nullstiller feilmelding, tidligere resultater, filtre og prisforslag, og setter `loading` — sikrer at brukergrensesnittet ikke viser gammel data mens et nytt kall er underveis.
- **Linje 59–67, `mode === "kjop"`-grenen**: `fetch("/api/search", ...)` med `query: input` i body, deretter `setFilters`/`setResults` direkte fra svaret.
- **Linje 68–87, `else`-grenen (selg)**: `fetch("/api/price-suggestion", ...)`. **Linje 75, `if (data.priceRange)`**: husk fra API-siden at `priceRange` er `null` når det ikke fantes sammenligningsgrunnlag i databasen — denne sjekken er der UI-et reflekterer akkurat det API-prinsippet. Fant den et intervall, bygges `draft` opp med `?.`/`??`-fallbacks (linje 77–82) i tilfelle AI-et ikke klarte å tolke merke/modell/tilstand, og brukeren føres til `step 2` (linje 84). Fant den ingenting, vises `data.reasoning` direkte som feilmelding (linje 86).
- **Linje 89–93, `catch`/`finally`**: `catch {}` fanger nettverksfeil (ingen parameter hentes ut siden feilteksten ikke brukes til noe), viser en generisk norsk feilmelding. `finally { setLoading(false); }` garanterer at loading-tilstanden alltid skrus av, uansett om kallet lyktes, feilet, eller kastet en feil underveis.

**Linje 96–110, `handleShowRecommendations`**: en enklere sti — henter *alle* aktive annonser fra `/api/listings` (ingen AI involvert) og viser bare de 6 første (`data.slice(0, 6)`) som en slags "utforsk"-snarvei uten at brukeren trenger å skrive noe søk.

**Linje 112–115, `handleImageUpload`**:
- `Array.from(e.target.files ?? [])` — `e.target.files` er en `FileList` (ikke en ekte array), så `Array.from` konverterer den til noe du kan bruke array-metoder på. `?? []` håndterer tilfellet der `files` er `null`.
- `setImages((prev) => [...prev, ...files].slice(0, 3))` — bruker **functional update**-formen av `setState` (en funksjon i stedet for en verdi) fordi den nye verdien avhenger av den forrige; legger de nye filene til den eksisterende listen, og kutter alltid ned til maks 3 med `.slice(0, 3)`.

**Linje 132–157, kjøp/selg-toggle-knappene**: `style={{ background: mode === "kjop" ? "#C4622E" : "transparent", ... }}` — inline betingede stiler, ikke CSS-klasser, som gir den aktive knappen fylt terrakotta-bakgrunn og den inaktive en gjennomsiktig bakgrunn med stiplet kant.

**Linje 211–219, bildeforhåndsvisning**: `URL.createObjectURL(images[i])` lager en midlertidig, kun-lokal URL i nettleseren som peker til filen i minnet — dette laster **ikke** opp noe til noen server. Det er derfor bildene aldri faktisk følger med annonsen ved publisering (se `GenerateDescription.tsx` sin `publish()`, som ikke sender noe bilde-data i det hele tatt).

**Linje 244–272, filter-chips**: `filters.budget && (...)` — betinget rendering-mønster i JSX: uttrykket til venstre for `&&` må være "truthy" for at høyresiden (JSX-en) skal rendres i det hele tatt. `filters.priorities?.map(...)` — `?.` her hindrer en krasj dersom `priorities` skulle mangle helt fra AI-svaret.

**Linje 274–379, step 2 (AI-forslag til redigering)**:
- **Linje 287–316**: `.map(({ label, key }) => ...)` over en liten liste med `{ label, key }`-par bygger fire like inputfelt (Merke/Modell/Tilstand/Pris) dynamisk i stedet for å skrive fire nesten-identiske JSX-blokker manuelt.
- **Linje 299, `value={String(draft[key as keyof typeof draft])}`**: `key` er typet som `string` fra `.map`, men TypeScript vil ikke automatisk godta et vilkårlig `string` som gyldig indeks inn i `draft`-objektet — `key as keyof typeof draft` er en **type assertion** som sier "stol på meg, denne strengen er faktisk et gyldig feltnavn på `draft`". `String(...)` rundt konverterer verdien (som kan være et tall, f.eks. `price`) til en visningsstreng for input-feltet.
- **Linje 300–304, `onChange`**: `setDraft((prev) => (prev ? { ...prev, [key]: e.target.value } : null))` — igjen functional update; `{ ...prev, [key]: e.target.value }` er et **computed property name**, som lar deg oppdatere akkurat det ene feltet `key` peker på, uansett hvilket av de fire feltene brukeren redigerte.
- **Linje 317–350, "Lagring"- og "Batterihelse"-feltene**: legg merke til at disse **ikke** har noen `value`/`onChange` i det hele tatt — de er rene, ukoblede placeholder-input-felt. De gjør ingenting funksjonelt ennå; de er lagt inn som visuell forberedelse for `batteryHealth`-feltet som etter planen legges til i databasen på mandag.
- **Linje 367, `draft.price.toLocaleString("no")`**: formaterer tallet med norsk tusenskille-format (f.eks. `5 900` i stedet for `5900`) — `"no"` er locale-koden for norsk.

**Linje 381–402, step 3**: rendrer `<GenerateDescription draft={draft} onPublish={() => {...}} />`. `onPublish`-funksjonen definert her er selve nullstillings-logikken som kjøres *etter* barnet har fullført publiseringen — `Hero.tsx` bestemmer hva "tilbake til start" betyr (tilbake til `step 1`, tøm `draft`, tøm søkefeltet, tøm valgte bilder), mens `GenerateDescription` selv bare trenger å vite *når* den skal kalle denne funksjonen, ikke *hva* den gjør.

**Linje 404–413, resultat-gridet**: `results.map((r) => <ListingCard key={r.id} listing={r} />)` rendrer ett kort per resultat, uavhengig av om `results` kom fra `/api/search` (med `reason`) eller `/api/listings` (uten). `key={r.id}` er Reacts krav om en stabil, unik nøkkel per listeelement for effektiv re-rendering.

---

## `src/components/GenerateDescription.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  brand: string;
  model: string;
  condition: string;
  price: number;
  description: string;
  reasoning: string;
};

export default function GenerateDescription({
  draft,
  onPublish,
}: {
  draft: Draft;
  onPublish: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(draft.description);
  const [loading, setLoading] = useState(false);

  async function generateDescription() {
    setLoading(true);
    const res = await fetch("/api/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: draft.brand,
        model: draft.model,
        condition: draft.condition,
        price: draft.price,
      }),
    });
    const data = await res.json();
    setDescription(data.description ?? "");
    setLoading(false);
  }

  async function publish() {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${draft.brand} ${draft.model}`,
        brand: draft.brand,
        model: draft.model,
        condition: draft.condition,
        price: Number(draft.price),
        description,
      }),
    });
    const listing = await res.json();
    router.push(`/annonse/${listing.id}`);
  }

  return (
    <>
      <p className="text-xs mb-3" style={{ color: "#8A7A68" }}>
        Beskriv annonsen
      </p>
      <button
        onClick={generateDescription}
        disabled={loading}
        style={{
          border: "1px solid #C4622E",
          color: "#C4622E",
          background: "transparent",
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 11,
          marginBottom: 10,
        }}
      >
        {loading ? "Genererer..." : "✦ Generer beskrivelse"}
      </button>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Beskriv telefonen..."
        style={{
          border: "1px solid #E9DCCB",
          background: "#FBF7F0",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          width: "100%",
          color: "#3A2E22",
          resize: "none",
          marginBottom: 12,
        }}
      />
      <button
        onClick={publish}
        style={{ background: "#C4622E", color: "#FBF7F0" }}
        className="w-full rounded-full py-2.5 text-sm"
      >
        Publiser annonse
      </button>
    </>
  );
}
```

**Linje 6–13, `type Draft`**: definerer nøyaktig samme form som `draft`-objektet i `Hero.tsx` — de to filene er koblet sammen via denne typen, men det er *ikke* samme type-definisjon delt i kode (de er skrevet ut på nytt hver plass), så en endring i den ene må også gjøres i den andre manuelt.

**Linje 15–20, propsene `{ draft, onPublish }`**: komponenten mottar `draft` (dataene den skal jobbe med) og `onPublish: () => void` (en callback uten parametre og uten returverdi) — den vet ingenting om *hvordan* forelderen håndterer "ferdig publisert", bare *at* den skal kalle denne funksjonen når det skjer.

**Linje 22, `const router = useRouter();`**: Next.js sin hook for programmatisk navigasjon (client-side, ingen full side-reload) — brukes i `publish()` for å sende brukeren til den nye annonsesiden.

**Linje 23, `useState(draft.description)`**: starter med `draft.description` som initial-verdi (vanligvis tom streng fra `Hero.tsx`), men lever som sin *egen* lokale state herfra — endres `draft` i forelderen etterpå, oppdateres *ikke* denne automatisk (kun ved første render/mount).

**Linje 26–41, `generateDescription`**:
- **Linje 27, `setLoading(true)`**: skrur på loading-tilstanden *før* fetch-kallet startes, slik at knappen kan vise "Genererer..." og deaktiveres (linje 67, `disabled={loading}`) mens man venter.
- **Linje 28–37**: `fetch` mot `/api/generate-description` med `brand`/`model`/`condition`/`price` fra `draft` som body.
- **Linje 39, `setDescription(data.description ?? "")`**: overskriver hva enn brukeren måtte ha skrevet i tekstfeltet fra før med det AI-genererte forslaget. `?? ""` er en fallback i tilfelle API-et av en eller annen grunn ikke returnerer noe `description`-felt.
- **Linje 40, `setLoading(false)`**: her er det **ingen** `try/catch/finally` (i motsetning til `handleSubmit` i `Hero.tsx`) — feiler `fetch` eller `res.json()`, forblir `loading` værende `true` for alltid, og knappen blir permanent deaktivert til siden lastes på nytt. Verdt å nevne som en kjent svakhet hvis det kommer opp i intervjuet.

**Linje 43–58, `publish`**:
- **Linje 44–55**: `fetch("/api/listings", { method: "POST", ... })` med et objekt bygget fra `draft` pluss den (eventuelt AI-genererte, eventuelt manuelt redigerte) `description`-staten.
- **Linje 48, `title: \`${draft.brand} ${draft.model}\``**: tittelen settes automatisk til "merke + modell" — brukeren får aldri selv skrive en egendefinert tittel i denne AI-flyten (i motsetning til `opprett/page.tsx`, hvor tittel er et fritt tekstfelt).
- **Linje 52, `price: Number(draft.price)`**: `draft.price` kan i praksis være en streng på dette tidspunktet (siden `<input>`-feltet i step 2 av `Hero.tsx` alltid returnerer strenger fra `e.target.value`, selv om TypeScript-typen sier `number`), så `Number(...)` tvinger den eksplisitt til et tall før den sendes til API-et, som forventer `price: Int` i databasen.
- **Linje 57, `router.push(...)`**: navigerer til den nyopprettede annonsens egen side — `listing.id` kommer fra JSON-responsen til `POST /api/listings` (se den ruten, som returnerer hele det opprettede objektet, inkludert den auto-genererte `id`-en).

**Linje 65, `disabled={loading}`**: hindrer brukeren fra å trigge flere samtidige `generateDescription()`-kall ved å klikke flere ganger raskt mens ett kall allerede er i gang.

**Linje 78, `"✦ Generer beskrivelse"`**: en liten Unicode-stjerne brukt som et enkelt "AI-signal"-ikon i teksten, uten å dra inn et helt ikon-bibliotek for én knapp.

**Linje 80–96, `<textarea>`**: er alltid **redigerbar** (`value={description}` + `onChange`), også etter at AI har generert et forslag — dette er bevisst, slik at det genererte forslaget er et utgangspunkt brukeren fritt kan justere, ikke et bindende pålegg.

---

## `src/components/ListingCard.tsx`

```tsx
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  imageUrl?: string | null;
  reason?: string;
};

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/annonse/${listing.id}`}
      style={{ border: "1px solid #E9DCCB", background: "white" }}
      className="rounded-xl p-4 block hover:opacity-90 transition"
    >
      {listing.imageUrl ? (
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      ) : (
        <div
          style={{ background: "#F3DCD1", color: "#C4622E" }}
          className="w-full h-32 rounded-lg mb-3 flex items-center justify-center text-2xl font-medium"
        >
          {listing.brand[0]}
        </div>
      )}

      <p className="font-medium" style={{ color: "#3A2E22" }}>
        {listing.title}
      </p>
      <p className="text-sm" style={{ color: "#8A7A68" }}>
        {listing.brand} {listing.model} · {listing.condition}
      </p>
      <p className="mt-1" style={{ color: "#C4622E" }}>
        {listing.price}kr
      </p>
      {listing.reason && (
        <p className="text-xs mt-2" style={{ color: "#A69581" }}>
          {listing.reason}
        </p>
      )}
    </Link>
  );
}
```

**Linje 1, `import Link from "next/link";`**: Next.js sin egen `<Link>`-komponent i stedet for en vanlig `<a>`-tag — gir **client-side navigasjon** (ingen full side-reload når brukeren klikker) og forhåndslasting av destinasjonssiden i bakgrunnen.

**Linje 3–12, `type Listing`**: en lokal type definert *i denne filen*, ikke importert fra Prisma sin genererte `Listing`-modell. Den overlapper mye med databasemodellen, men er bevisst litt løsere (`condition: string` i stedet for enumen `Condition`, `imageUrl?: string | null` som håndterer både "feltet mangler" og "feltet er eksplisitt `null`") og har i tillegg `reason?: string`, som ikke finnes i databasen i det hele tatt — det er et felt som kun eksisterer i søkeresultat-responsen fra `/api/search`.

**Linje 14, `{ listing }: { listing: Listing }`**: hele komponenten tar imot **ett** objekt gjennom én enkelt `listing`-prop, i stedet for mange separate props (`title`, `brand`, `price`, ...) — gjør at komponenten kan brukes identisk uansett om `listing` kommer fra `/api/search` (med `reason`) eller `/api/listings` (uten).

**Linje 16–19, `<Link href={...}>` som ytre element**: hele kortet er én stor klikkbar lenke til `/annonse/${listing.id}` — ikke en `<div>` med en knapp inni, som ville gitt dårligere tilgjengelighet (skjermlesere/tastaturnavigasjon forstår `<a>`-semantikk umiddelbart).

**Linje 21–33, betinget bilde/fallback**: `listing.imageUrl ? <img ...> : <div>...</div>` — samme mønster som i `annonse/[id]/page.tsx`. Mangler bildet, vises i stedet en terrakotta-farget boks med forbokstaven i merkenavnet (`listing.brand[0]`) som en enkel, stilfull placeholder i stedet for et knekt bilde-ikon.

**Linje 40, `{listing.brand} {listing.model} · {listing.condition}`**: `·` (midtpunktum) brukt som visuelt skilletegn mellom tre korte tekstbiter — en vanlig norsk/nordisk UI-konvensjon for kompakt metadata-visning.

**Linje 45–49, `{listing.reason && (...)}`**: samme betinget rendering-mønster som i `Hero.tsx` — AI-begrunnelsen vises kun når den faktisk finnes (dvs. kortet brukes i et søkeresultat), og er usynlig/fraværende når samme komponent gjenbrukes i "Våre anbefalinger"-visningen.
