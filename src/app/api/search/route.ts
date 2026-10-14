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
    temperature: 0,
    system:
      'Du tolker norske fritekst-søk etter brukte telefoner til JSON. Svar KUN med JSON, ingen annen tekst. Felt: budget (maks pris i kr, tall eller null), brand ("Apple", "Samsung", "Google", "Xiaomi", eller null), model (modellnavn skrevet slik det står i annonser, eller null), minBatteryHealth (minimum batterihelse i prosent hvis nevnt, f.eks "over 80%" gir 80, ellers null), minStorage (minimum lagring i GB hvis nevnt, f.eks "minst 256GB" gir 256 og "1 TB" gir 1024, ellers null), priorities (liste med andre stikkord som ikke fanges av feltene over). Regler for model: Apple skrives med "iPhone" foran, f.eks "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max". Samsung skrives f.eks "Galaxy S24". Google skrives f.eks "Pixel 8". Xiaomi skrives f.eks "13" eller "Redmi Note 12". Skriv kun det brukeren faktisk nevner: "13" gir "iPhone 13", "13 pro" gir "iPhone 13 Pro", "13 pro max" gir "iPhone 13 Pro Max". Et tall alene uten merke tolkes som iPhone. Pro eller Pro Max sammen med et tall tolkes som iPhone. Hvis modellen avslører merket (iPhone gir Apple, Galaxy gir Samsung, Pixel gir Google), sett brand også. Ikke gjett en modell som ikke er nevnt. "godt batteri" gir minBatteryHealth 80.',
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
  const listings = await prisma.listing.findMany({
    where: {
      status: "AKTIV",
      ...(filters.budget ? { price: { lte: filters.budget } } : {}),
      ...(filters.brand
        ? { brand: { equals: filters.brand, mode: "insensitive" } }
        : {}),
      ...(filters.model
        ? { model: { contains: filters.model, mode: "insensitive" } }
        : {}),
      ...(filters.minBatteryHealth
        ? { batteryHealth: { gte: filters.minBatteryHealth } }
        : {}),
      ...(filters.minStorage ? { storage: { gte: filters.minStorage } } : {}),
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

  const results = listings.map((listing) => ({
    ...listing,
    reason: reasons.find((r) => r.id === listing.id)?.reason ?? "",
  }));

  return NextResponse.json({ filters, results });
}
