import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { Condition } from "@/generated/prisma/enums";

const anthropic = new Anthropic();

const VALID_CONDITIONS: string[] = Object.values(Condition);

const SORT_ORDER_BY: Record<string, { price?: "asc" | "desc"; createdAt?: "desc" }> = {
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  newest: { createdAt: "desc" },
};

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function buildWhere(filters: Record<string, unknown>) {
  const priceFilter: { lte?: number; gte?: number } = {};
  if (filters.budget) priceFilter.lte = filters.budget as number;
  if (filters.minPrice) priceFilter.gte = filters.minPrice as number;

  const conditions: Condition[] = Array.isArray(filters.conditions)
    ? (filters.conditions as string[]).filter((c): c is Condition =>
        VALID_CONDITIONS.includes(c),
      )
    : [];

  return {
    status: "AKTIV" as const,
    ...(Object.keys(priceFilter).length ? { price: priceFilter } : {}),
    ...(conditions.length ? { condition: { in: conditions } } : {}),
    ...(filters.brand
      ? { brand: { equals: filters.brand as string, mode: "insensitive" as const } }
      : {}),
    ...(filters.model
      ? { model: { contains: filters.model as string, mode: "insensitive" as const } }
      : {}),
    ...(filters.minBatteryHealth
      ? { batteryHealth: { gte: filters.minBatteryHealth as number } }
      : {}),
    ...(filters.minStorage
      ? { storage: { gte: filters.minStorage as number } }
      : {}),
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const { query, offset } = body;
  const skip = Number(offset) > 0 ? Number(offset) : 0;

  if (!query && !body.filters) {
    return NextResponse.json({ error: "Mangler søk" }, { status: 400 });
  }

  // Ferdige filtre fra en tidligere "Vis flere"-forespørsel: hopp over AI-tolkningen
  if (body.filters) {
    const filters = body.filters;
    const where = buildWhere(filters);

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: SORT_ORDER_BY[filters.sortBy] ?? SORT_ORDER_BY.newest,
        skip,
        take: 10,
      }),
      prisma.listing.count({ where }),
    ]);

    const results = await withReasons(listings, query ?? "");
    return NextResponse.json({ filters, results, total });
  }

  // Kall 1: fritekst -> strukturerte filtre
  const parseResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    temperature: 0,
    system:
      'Du tolker norske fritekst-søk etter brukte telefoner til JSON. Svar KUN med JSON, ingen annen tekst. Felt: budget (maks pris i kr, tall eller null), minPrice (minste pris i kr hvis nevnt, f.eks "over 4000kr", "4k", "4000,-", "4 000 kr" og "fire tusen" gir alle 4000, ellers null), conditions (liste med tilstander brukeren vil ha, kun verdiene "NY", "PENT_BRUKT", "BRUKT", "GODT_BRUKT", eller null hvis uklart. "som ny" gir ["NY","PENT_BRUKT"]. "pent brukt" gir ["PENT_BRUKT"]. "helt ny"/"ny" gir ["NY"]. "godt brukt" gir ["GODT_BRUKT"]. "brukt" helt alene, uten "pent" eller "godt" foran, er for vagt siden alle annonser på en bruktmarkedsplass er brukte telefoner i vid forstand, og gir null. Gjett ikke en tilstand som ikke er antydet.), sortBy ("price_asc" hvis brukeren vil ha billigst/lavest pris først som hovedønske, f.eks "billigste" eller "billig" når det er det brukeren ber om, "price_desc" hvis brukeren vil ha dyrest/høyest pris først, f.eks "dyreste", ellers "newest"), unsupported (liste med ord for ting søket IKKE kan filtrere på: farge (f.eks "svart", "hvit", "rosa"), sted (f.eks "Oslo", "Bergen"), og bruksområde (f.eks "til barn", "til jobb"). Disse skal ALDRI legges i priorities, kun i unsupported.), brand ("Apple", "Samsung", "Google", "Xiaomi", eller null), model (modellnavn skrevet slik det står i annonser, eller null), minBatteryHealth (minimum batterihelse i prosent hvis nevnt, f.eks "over 80%" gir 80, ellers null), minStorage (minimum lagring i GB hvis nevnt, f.eks "minst 256GB" gir 256 og "1 TB" gir 1024, ellers null), priorities (liste med andre stikkord som ikke fanges av feltene over, f.eks "billig" og "nyere" skal alltid med her som egne ord, i tillegg til at de kan påvirke sortBy). Regler for model: Apple skrives med "iPhone" foran, f.eks "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max". Samsung skrives f.eks "Galaxy S24". Google skrives f.eks "Pixel 8". Xiaomi skrives f.eks "13" eller "Redmi Note 12". Skriv kun det brukeren faktisk nevner: "13" gir "iPhone 13", "13 pro" gir "iPhone 13 Pro", "13 pro max" gir "iPhone 13 Pro Max". Et tall alene uten merke tolkes som iPhone. Pro eller Pro Max sammen med et tall tolkes som iPhone. "Xiaomi 13" gir brand "Xiaomi" og model "13" (ikke "Xiaomi 13"), siden Xiaomi ikke har et eget modellnavn-prefiks. Ignorer mellomrom, store/små bokstaver og skrivefeil når du gjenkjenner modell, og normaliser alltid til riktig skriveform: "iphone13pro", "13promax" og "iPhone 13 pro maks" betyr alle "iPhone 13 Pro Max" ("maks" er norsk for "Max"). Samsung kan skrives kort som "s" pluss tall, med eller uten mellomrom: "s24" og "galaxy s 24" betyr begge "Galaxy S24" (ingen mellomrom mellom S og tallet i svaret). Google kan skrives kort som "pixel" pluss tall uten mellomrom: "pixel8" betyr "Pixel 8" (mellomrom i svaret). Hvis modellen avslører merket (iPhone gir Apple, Galaxy gir Samsung, Pixel gir Google), sett brand også. Ikke gjett en modell som ikke er nevnt. "godt batteri" gir minBatteryHealth 80.',
    messages: [
      {
        role: "user",
        content: `Tolk søket til JSON.\n\nSøk: "${query}"`,
      },
    ],
  });

  const parseBlock = parseResponse.content[0];
  const filters =
    parseBlock.type === "text" ? (parseJson(parseBlock.text) ?? {}) : {};

  // Steg 2: query mot databasen basert på filtrene
  const where = buildWhere(filters);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: SORT_ORDER_BY[filters.sortBy] ?? SORT_ORDER_BY.newest,
      skip,
      take: 10,
    }),
    prisma.listing.count({ where }),
  ]);

  const results = await withReasons(listings, query);
  return NextResponse.json({ filters, results, total });
}

// Kall 2: treff + søk -> kort begrunnelse per annonse (kun for annonsene på denne siden)
async function withReasons(
  listings: Awaited<ReturnType<typeof prisma.listing.findMany>>,
  query: string,
) {
  if (listings.length === 0) return [];

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
            batteryHealth: l.batteryHealth,
            storage: l.storage,
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

  return listings.map((listing) => ({
    ...listing,
    reason: reasons.find((r) => r.id === listing.id)?.reason ?? "",
  }));
}
