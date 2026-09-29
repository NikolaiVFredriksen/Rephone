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
  const { description } = await req.json();
  if (!description) {
    return NextResponse.json({ error: "Mangler beskrivelse" }, { status: 400 });
  }

  // Kall 1: fritekst -> merke, modell, tilstand, batterihelse, lagring
  const parseResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      'Du tolker norske beskrivelser av brukte telefoner til JSON. Felt: brand (f.eks "Apple", "Samsung"), model (f.eks "iPhone 13 Pro"), condition (ett av: NY, PENT_BRUKT, BRUKT, GODT_BRUKT, eller null hvis uklart), batteryHealth (tall 0-100 hvis nevnt, ellers null), storage (tall i GB, f.eks 128, 256, 1024 for 1TB, eller null hvis ikke nevnt). Svar KUN med JSON.',
    messages: [{ role: "user", content: description }],
  });

  const parseBlock = parseResponse.content[0];
  const parsed = parseBlock.type === "text" ? parseJson(parseBlock.text) : {};

  // Steg 2a: hent egne, aktive annonser som ligner
  const similarListings = await prisma.listing.findMany({
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

  // Steg 2b: hent referansepriser som ligner, uavhengig av om egne annonser finnes
  const referencePrices = await prisma.referencePrice.findMany({
    where: {
      ...(parsed.brand
        ? { brand: { equals: parsed.brand, mode: "insensitive" } }
        : {}),
      ...(parsed.model
        ? { model: { contains: parsed.model, mode: "insensitive" } }
        : {}),
    },
    take: 5,
  });

  // Ingen grunnlag i det hele tatt, verken egne annonser eller referansepriser
  if (similarListings.length === 0 && referencePrices.length === 0) {
    return NextResponse.json({
      parsed,
      priceRange: null,
      reasoning:
        "Fant ingen sammenlignbare annonser eller referansepriser for denne modellen, for tidlig å foreslå en pris.",
    });
  }

  // Filtrer referansepriser til kun den tolkede tilstanden, hvis kjent
  const relevantReferencePrices = parsed.condition
    ? referencePrices.filter((r) => r.condition === parsed.condition)
    : referencePrices;

  // Kall 2: beskrivelse + egne annonser + referansepriser -> prisintervall med begrunnelse
  const suggestResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      "Du foreslår et prisintervall i norske kroner for en brukt telefon, basert på lignende annonser og kjente referansepriser. Ta hensyn til batterihelse og lagringsstørrelse hvis oppgitt: lavere batterihelse (under 80%) trekker prisen ned, høyere lagring trekker prisen opp. Prioriter faktiske annonser i markedet over referansepriser hvis begge finnes. Bruk naturlig norsk i begrunnelsen (f.eks. 'pent brukt', 'godt brukt'), aldri tekniske koder som GODT_BRUKT. Svar KUN med JSON: { low, high, reasoning } der reasoning er maks 20 ord på norsk.",
    messages: [
      {
        role: "user",
        content: `Beskrivelse av telefonen som skal selges: "${description}"\nTolket tilstand: ${parsed.condition ? (CONDITION_LABELS[parsed.condition] ?? parsed.condition) : "ikke oppgitt"}\nTolket batterihelse: ${parsed.batteryHealth ?? "ikke oppgitt"}\nTolket lagring: ${parsed.storage ?? "ikke oppgitt"}GB\n\nLignende annonser i markedet akkurat nå:\n${JSON.stringify(
          similarListings.map((l) => ({
            model: l.model,
            condition: CONDITION_LABELS[l.condition] ?? l.condition,
            price: l.price,
            batteryHealth: l.batteryHealth,
            storage: l.storage,
          })),
        )}\n\nKjente referansepriser for denne modellen og tilstanden:\n${JSON.stringify(
          relevantReferencePrices.map((r) => ({
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
    parsed,
    priceRange: { low: suggestion.low, high: suggestion.high },
    reasoning: suggestion.reasoning,
  });
}
