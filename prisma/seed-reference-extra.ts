import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// --update overskriver priser som allerede finnes. Uten flagget hoppes de over.
const UPDATE = process.argv.includes("--update");

// Pris relativt til "pent brukt".
const FACTOR = {
  NY: 1.25,
  PENT_BRUKT: 1,
  BRUKT: 0.88,
  GODT_BRUKT: 0.78,
} as const;
type Cond = keyof typeof FACTOR;

// Pent brukt, oktober 2026, i kr. Kommentar viser hvor tallet kommer fra.
const MODELS: Record<string, number> = {
  "iPhone 11": 1800, // anslag
  "iPhone 11 Pro": 2300, // anslag
  "iPhone 11 Pro Max": 2600, // anslag
  "iPhone 12": 2300, // anslag
  "iPhone 12 Mini": 1900, // anslag
  "iPhone 12 Pro": 3000, // anslag
  "iPhone 12 Pro Max": 3400, // anslag
  "iPhone 13": 3300, // anslag
  "iPhone 13 Mini": 2600, // anslag
  "iPhone 13 Pro": 4000, // Finn, okt 2025
  "iPhone 13 Pro Max": 4700, // anslag
  "iPhone 14": 4000, // anslag
  "iPhone 14 Plus": 4300, // anslag
  "iPhone 14 Pro": 5300, // anslag
  "iPhone 14 Pro Max": 5900, // anslag
  "iPhone 15": 5000, // anslag
  "iPhone 15 Plus": 5400, // anslag
  "iPhone 15 Pro": 6200, // Finn 6900 okt 2025, justert ned ett år
  "iPhone 15 Pro Max": 7200, // anslag
  "iPhone 16": 5300, // Finn 6300 til 6900 ask, justert
  "iPhone 16 Plus": 5800, // anslag
  "iPhone 16 Pro": 7300, // anslag
  "iPhone 16 Pro Max": 8700, // anslag
  "iPhone 17e": 6200, // anslag
  "iPhone 17": 7200, // Finn 7999 ask mars 2026, justert
  "iPhone Air": 6700, // anslag
  "iPhone 17 Pro": 9800, // oppkjøper 8000-8900, justert opp til privatsalg
  "iPhone 17 Pro Max": 11000, // oppkjøper 8500-9900, justert opp
  "iPhone 18 Pro": 13800, // ny 15 990, ca. 86 prosent første måneden
  "iPhone 18 Pro Max": 15600, // ny 17 990, ca. 87 prosent
  "iPhone 18": 10800, // IKKE LANSERT, rent anslag
  "iPhone Duo": 22000, // ny 25 990, anslag
};

// Nypris der vi har kilde. "Ny" kan ikke ligge over dette.
const NEW_PRICE: Record<string, number> = {
  "iPhone 18 Pro": 15990,
  "iPhone 18 Pro Max": 17990,
  "iPhone Air": 14990,
  "iPhone Duo": 25990,
};

function priceFor(model: string, base: number, cond: Cond) {
  let p = base * FACTOR[cond];
  const cap = NEW_PRICE[model];
  if (cond === "NY" && cap) p = Math.min(p, cap * 0.97);
  return Math.round(p / 100) * 100;
}

async function main() {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const [model, base] of Object.entries(MODELS)) {
    for (const cond of Object.keys(FACTOR) as Cond[]) {
      const price = priceFor(model, base, cond);
      const exists = await prisma.referencePrice.findFirst({
        where: { brand: "Apple", model, condition: cond },
      });
      if (exists) {
        if (UPDATE) {
          await prisma.referencePrice.update({
            where: { id: exists.id },
            data: { price },
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }
      await prisma.referencePrice.create({
        data: { brand: "Apple", model, condition: cond, price },
      });
      added++;
    }
  }

  console.log(
    `Lagt til ${added}, oppdatert ${updated}, hoppet over ${skipped}.`,
  );
}

main().finally(() => prisma.$disconnect());
