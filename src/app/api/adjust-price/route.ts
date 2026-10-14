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

const STORAGE_STEPS = [64, 128, 256, 512, 1024];
const STORAGE_STEP_VALUE = 500;
const BATTERY_THRESHOLD = 80;
const BATTERY_PENALTY_PER_POINT = 30;

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function batteryPenalty(health: number) {
  return health < BATTERY_THRESHOLD
    ? (BATTERY_THRESHOLD - health) * BATTERY_PENALTY_PER_POINT
    : 0;
}

export async function POST(req: Request) {
  const {
    brand,
    model,
    condition,
    storage,
    batteryHealth,
    basePrice,
    baseStorage,
    baseBatteryHealth,
  } = await req.json();

  if (!brand || !model || !condition) {
    return NextResponse.json({ error: "Mangler felt" }, { status: 400 });
  }

  // Ingen tidligere pris: hent et helt nytt forslag fra markedsdata
  if (!basePrice) {
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
      temperature: 0,
      system:
        "Du foreslår en pris i norske kroner for en brukt telefon, basert på lignende annonser og kjente referansepriser. Prioriter faktiske annonser over referansepriser. Bruk naturlig norsk i begrunnelsen, aldri tekniske koder. Svar KUN med JSON: { price, reasoning } der price er et helt tall og reasoning er maks 20 ord på norsk.",
      messages: [
        {
          role: "user",
          content: `Telefon: ${brand} ${model}, tilstand: ${CONDITION_LABELS[condition] ?? condition}, lagring: ${storage ?? "ikke oppgitt"}GB, batterihelse: ${batteryHealth ?? "ikke oppgitt"}%\n\nLignende annonser:\n${JSON.stringify(
            similarListings.map((l) => ({
              model: l.model,
              condition: CONDITION_LABELS[l.condition] ?? l.condition,
              price: l.price,
              storage: l.storage,
              batteryHealth: l.batteryHealth,
            })),
          )}\n\nReferansepriser:\n${JSON.stringify(
            referencePrices.map((r) => ({
              model: r.model,
              condition: CONDITION_LABELS[r.condition] ?? r.condition,
              price: r.price,
            })),
          )}`,
        },
      ],
    });

    const block = suggestResponse.content[0];
    const suggestion = block.type === "text" ? parseJson(block.text) : null;

    if (!suggestion || typeof suggestion.price !== "number") {
      console.error("adjust-price: ugyldig svar fra modellen");
      return NextResponse.json(
        { error: "Kunne ikke generere forslag" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      price: Math.round(suggestion.price),
      reasoning: suggestion.reasoning ?? "",
    });
  }

  // Har en tidligere pris: juster den i kode, uten modell
  let adjusted = Number(basePrice);
  const changes: string[] = [];

  if (storage && baseStorage && storage !== baseStorage) {
    const oldIndex = STORAGE_STEPS.indexOf(baseStorage);
    const newIndex = STORAGE_STEPS.indexOf(storage);
    if (oldIndex !== -1 && newIndex !== -1) {
      const steps = newIndex - oldIndex;
      adjusted += steps * STORAGE_STEP_VALUE;
      changes.push(steps > 0 ? "høyere lagring" : "lavere lagring");
    }
  }

  if (
    batteryHealth != null &&
    baseBatteryHealth != null &&
    batteryHealth !== baseBatteryHealth
  ) {
    const diff =
      batteryPenalty(baseBatteryHealth) - batteryPenalty(batteryHealth);
    adjusted += diff;
    if (diff !== 0) {
      changes.push(
        batteryHealth < baseBatteryHealth
          ? "lavere batterihelse"
          : "bedre batterihelse",
      );
    }
  }

  return NextResponse.json({
    price: Math.max(0, Math.round(adjusted)),
    reasoning:
      changes.length > 0
        ? `Justert for ${changes.join(" og ")}.`
        : "Ingen prisrelevante endringer.",
  });
}
