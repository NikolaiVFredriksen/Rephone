import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const listings = await prisma.listing.findMany({
    select: { brand: true, model: true },
    distinct: ["brand", "model"],
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  for (const l of listings) {
    console.log(`${l.brand} | ${l.model}`);
  }
  console.log(`\nAntall distinkte brand+model: ${listings.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
