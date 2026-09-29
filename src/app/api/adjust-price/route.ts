import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

const CONDITION_LABELS: Record<string, string> = {
  NY: "ny",
  PENT_BRUKT: "pent brukt",
  BRUKT: "brukt",
  GODT_BRUKT: "godt brukt",
};

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  const { brand, model, condition, storage, batteryHealth } = await req.json();

  if (!brand || !model || !condition) {
    return NextResponse.json({ error: "Mangler felt" }, { status: 400 });
  }

  const similarListings = await prisma.listing.findMany({
    where: {
      status: "AKTIV",
      brand: { equals: brand, mode: "insensitive" },
      model: { contains: model, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const referencePrices = await prisma.referencePrice.findMany({
    where: {
      brand: { equals: brand, mode: "insensitive" },
      model: { contains: model, mode: "insensitive" },
      condition,
    },
    take: 5,
  });

  if (similarListings.length === 0 && referencePrices.length === 0) {
    return NextResponse.json(
      { error: "Ingen grunnlag for prisforslag" },
      { status: 404 },
    );
  }

  const suggestResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      "Du foreslår et prisintervall i norske kroner for en brukt telefon, basert på lignende annonser og kjente referansepriser. VIKTIG: lagring og batterihelse er allerede endret fra forrige forslag, prisen MÅ derfor endres tilsvarende, aldri returner samme low-verdi som ville vært riktig for en annen lagring/batterihelse. Konkret regel: høyere lagring enn forrige steg gir minst 300-800kr høyere pris, lavere batterihelse enn 80% gir minst 200-500kr lavere pris. Bruk naturlig norsk i begrunnelsen, aldri tekniske koder. Svar KUN med JSON: { low, high, reasoning } der reasoning er maks 20 ord på norsk.",
    messages: [
      {
        role: "user",
        content: `Telefon: ${brand} ${model}, tilstand: ${CONDITION_LABELS[condition] ?? condition}, lagring: ${storage ?? "ikke oppgitt"}GB, batterihelse: ${batteryHealth ?? "ikke oppgitt"}%\n\nLignende annonser i markedet:\n${JSON.stringify(
          similarListings.map((l) => ({
            model: l.model,
            condition: CONDITION_LABELS[l.condition] ?? l.condition,
            price: l.price,
            storage: l.storage,
            batteryHealth: l.batteryHealth,
          })),
        )}\n\nKjente referansepriser:\n${JSON.stringify(
          referencePrices.map((r) => ({
            model: r.model,
            condition: CONDITION_LABELS[r.condition] ?? r.condition,
            price: r.price,
          })),
        )}`,
      },
    ],
  });

  const suggestBlock = suggestResponse.content[0];
  const suggestion =
    suggestBlock.type === "text" ? parseJson(suggestBlock.text) : {};

  return NextResponse.json({
    price: suggestion.low,
    reasoning: suggestion.reasoning,
  });
}
