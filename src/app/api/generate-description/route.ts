import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { brand, model, condition, price, batteryHealth, storage } =
    await req.json();

  const details = [
    batteryHealth ? `batterihelse: ${batteryHealth}%` : null,
    storage ? `lagring: ${storage}GB` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      "Du skriver korte, ærlige annonsetekster for brukte telefoner på norsk. Maks 3 setninger. Ikke overselg. Ikke bruk utropstegn. Bruk kun de faktiske detaljene som er oppgitt, ikke finn på tall som ikke er nevnt.",
    messages: [
      {
        role: "user",
        content: `Skriv en annonsetekst for: ${brand} ${model}, tilstand: ${condition}${details ? ", " + details : ""}, pris: ${price}kr`,
      },
    ],
  });

  const block = response.content[0];
  const description = block.type === "text" ? block.text : "";
  return NextResponse.json({ description });
}
