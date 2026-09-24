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
