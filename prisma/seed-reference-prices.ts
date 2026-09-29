import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const referencePrices = [
  // iPhone 11
  {
    brand: "Apple",
    model: "iPhone 11",
    condition: "PENT_BRUKT" as const,
    price: 1800,
  },
  {
    brand: "Apple",
    model: "iPhone 11",
    condition: "BRUKT" as const,
    price: 1400,
  },
  {
    brand: "Apple",
    model: "iPhone 11",
    condition: "GODT_BRUKT" as const,
    price: 1000,
  },

  // iPhone 12
  {
    brand: "Apple",
    model: "iPhone 12",
    condition: "PENT_BRUKT" as const,
    price: 2500,
  },
  {
    brand: "Apple",
    model: "iPhone 12",
    condition: "BRUKT" as const,
    price: 2000,
  },
  {
    brand: "Apple",
    model: "iPhone 12",
    condition: "GODT_BRUKT" as const,
    price: 1500,
  },

  // iPhone 13
  {
    brand: "Apple",
    model: "iPhone 13",
    condition: "PENT_BRUKT" as const,
    price: 3200,
  },
  {
    brand: "Apple",
    model: "iPhone 13",
    condition: "BRUKT" as const,
    price: 2600,
  },
  {
    brand: "Apple",
    model: "iPhone 13",
    condition: "GODT_BRUKT" as const,
    price: 2100,
  },

  // iPhone 13 Pro
  {
    brand: "Apple",
    model: "iPhone 13 Pro",
    condition: "PENT_BRUKT" as const,
    price: 4200,
  },
  {
    brand: "Apple",
    model: "iPhone 13 Pro",
    condition: "BRUKT" as const,
    price: 3500,
  },
  {
    brand: "Apple",
    model: "iPhone 13 Pro",
    condition: "GODT_BRUKT" as const,
    price: 2800,
  },

  // iPhone 14
  {
    brand: "Apple",
    model: "iPhone 14",
    condition: "PENT_BRUKT" as const,
    price: 4300,
  },
  {
    brand: "Apple",
    model: "iPhone 14",
    condition: "BRUKT" as const,
    price: 3600,
  },
  {
    brand: "Apple",
    model: "iPhone 14",
    condition: "GODT_BRUKT" as const,
    price: 2900,
  },

  // iPhone 14 Pro
  {
    brand: "Apple",
    model: "iPhone 14 Pro",
    condition: "PENT_BRUKT" as const,
    price: 5800,
  },
  {
    brand: "Apple",
    model: "iPhone 14 Pro",
    condition: "BRUKT" as const,
    price: 4900,
  },
  {
    brand: "Apple",
    model: "iPhone 14 Pro",
    condition: "GODT_BRUKT" as const,
    price: 4000,
  },

  // iPhone 15
  {
    brand: "Apple",
    model: "iPhone 15",
    condition: "PENT_BRUKT" as const,
    price: 5800,
  },
  {
    brand: "Apple",
    model: "iPhone 15",
    condition: "BRUKT" as const,
    price: 4900,
  },
  {
    brand: "Apple",
    model: "iPhone 15",
    condition: "GODT_BRUKT" as const,
    price: 4000,
  },

  // iPhone 15 Pro
  {
    brand: "Apple",
    model: "iPhone 15 Pro",
    condition: "PENT_BRUKT" as const,
    price: 7200,
  },
  {
    brand: "Apple",
    model: "iPhone 15 Pro",
    condition: "BRUKT" as const,
    price: 6200,
  },
  {
    brand: "Apple",
    model: "iPhone 15 Pro",
    condition: "GODT_BRUKT" as const,
    price: 5200,
  },

  // iPhone 16
  {
    brand: "Apple",
    model: "iPhone 16",
    condition: "PENT_BRUKT" as const,
    price: 7200,
  },
  {
    brand: "Apple",
    model: "iPhone 16",
    condition: "BRUKT" as const,
    price: 6200,
  },
  {
    brand: "Apple",
    model: "iPhone 16",
    condition: "GODT_BRUKT" as const,
    price: 5200,
  },

  // iPhone 16 Pro
  {
    brand: "Apple",
    model: "iPhone 16 Pro",
    condition: "PENT_BRUKT" as const,
    price: 9200,
  },
  {
    brand: "Apple",
    model: "iPhone 16 Pro",
    condition: "BRUKT" as const,
    price: 8000,
  },
  {
    brand: "Apple",
    model: "iPhone 16 Pro",
    condition: "GODT_BRUKT" as const,
    price: 6800,
  },

  // iPhone 17
  {
    brand: "Apple",
    model: "iPhone 17",
    condition: "PENT_BRUKT" as const,
    price: 9800,
  },
  {
    brand: "Apple",
    model: "iPhone 17",
    condition: "BRUKT" as const,
    price: 8600,
  },
  {
    brand: "Apple",
    model: "iPhone 17",
    condition: "GODT_BRUKT" as const,
    price: 7400,
  },

  // iPhone 17 Pro
  {
    brand: "Apple",
    model: "iPhone 17 Pro",
    condition: "PENT_BRUKT" as const,
    price: 12500,
  },
  {
    brand: "Apple",
    model: "iPhone 17 Pro",
    condition: "BRUKT" as const,
    price: 11000,
  },
  {
    brand: "Apple",
    model: "iPhone 17 Pro",
    condition: "GODT_BRUKT" as const,
    price: 9500,
  },

  // Samsung Galaxy S22
  {
    brand: "Samsung",
    model: "Galaxy S22",
    condition: "PENT_BRUKT" as const,
    price: 2800,
  },
  {
    brand: "Samsung",
    model: "Galaxy S22",
    condition: "BRUKT" as const,
    price: 2200,
  },
  {
    brand: "Samsung",
    model: "Galaxy S22",
    condition: "GODT_BRUKT" as const,
    price: 1700,
  },

  // Samsung Galaxy S23
  {
    brand: "Samsung",
    model: "Galaxy S23",
    condition: "PENT_BRUKT" as const,
    price: 3800,
  },
  {
    brand: "Samsung",
    model: "Galaxy S23",
    condition: "BRUKT" as const,
    price: 3100,
  },
  {
    brand: "Samsung",
    model: "Galaxy S23",
    condition: "GODT_BRUKT" as const,
    price: 2500,
  },

  // Samsung Galaxy S24
  {
    brand: "Samsung",
    model: "Galaxy S24",
    condition: "PENT_BRUKT" as const,
    price: 5200,
  },
  {
    brand: "Samsung",
    model: "Galaxy S24",
    condition: "BRUKT" as const,
    price: 4400,
  },
  {
    brand: "Samsung",
    model: "Galaxy S24",
    condition: "GODT_BRUKT" as const,
    price: 3600,
  },

  // Samsung Galaxy S25
  {
    brand: "Samsung",
    model: "Galaxy S25",
    condition: "PENT_BRUKT" as const,
    price: 6800,
  },
  {
    brand: "Samsung",
    model: "Galaxy S25",
    condition: "BRUKT" as const,
    price: 5800,
  },
  {
    brand: "Samsung",
    model: "Galaxy S25",
    condition: "GODT_BRUKT" as const,
    price: 4800,
  },

  // Samsung Galaxy S26
  {
    brand: "Samsung",
    model: "Galaxy S26",
    condition: "PENT_BRUKT" as const,
    price: 8800,
  },
  {
    brand: "Samsung",
    model: "Galaxy S26",
    condition: "BRUKT" as const,
    price: 7700,
  },
  {
    brand: "Samsung",
    model: "Galaxy S26",
    condition: "GODT_BRUKT" as const,
    price: 6600,
  },

  // Google Pixel 7
  {
    brand: "Google",
    model: "Pixel 7",
    condition: "PENT_BRUKT" as const,
    price: 2400,
  },
  {
    brand: "Google",
    model: "Pixel 7",
    condition: "BRUKT" as const,
    price: 1900,
  },
  {
    brand: "Google",
    model: "Pixel 7",
    condition: "GODT_BRUKT" as const,
    price: 1500,
  },

  // Google Pixel 8
  {
    brand: "Google",
    model: "Pixel 8",
    condition: "PENT_BRUKT" as const,
    price: 3400,
  },
  {
    brand: "Google",
    model: "Pixel 8",
    condition: "BRUKT" as const,
    price: 2800,
  },
  {
    brand: "Google",
    model: "Pixel 8",
    condition: "GODT_BRUKT" as const,
    price: 2200,
  },

  // Xiaomi 13
  {
    brand: "Xiaomi",
    model: "13",
    condition: "PENT_BRUKT" as const,
    price: 2600,
  },
  { brand: "Xiaomi", model: "13", condition: "BRUKT" as const, price: 2100 },
  {
    brand: "Xiaomi",
    model: "13",
    condition: "GODT_BRUKT" as const,
    price: 1600,
  },

  // Xiaomi Redmi Note 12
  {
    brand: "Xiaomi",
    model: "Redmi Note 12",
    condition: "PENT_BRUKT" as const,
    price: 1400,
  },
  {
    brand: "Xiaomi",
    model: "Redmi Note 12",
    condition: "BRUKT" as const,
    price: 1100,
  },
  {
    brand: "Xiaomi",
    model: "Redmi Note 12",
    condition: "GODT_BRUKT" as const,
    price: 800,
  },
];

async function main() {
  console.log(`Sletter eksisterende referansepriser...`);
  await prisma.referencePrice.deleteMany();

  console.log(`Legger inn ${referencePrices.length} referansepriser...`);
  await prisma.referencePrice.createMany({
    data: referencePrices,
  });

  console.log("Ferdig!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
