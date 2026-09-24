import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
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
  const filters = parseBlock.type === "text" ? parseJson(parseBlock.text) : {};

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
    reasoningBlock.type === "text" ? parseJson(reasoningBlock.text) : [];

  const results = listings.map((listing) => ({
    ...listing,
    reason: reasons.find((r) => r.id === listing.id)?.reason ?? "",
  }));

  return NextResponse.json({ filters, results });
}
