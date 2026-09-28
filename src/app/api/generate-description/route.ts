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
