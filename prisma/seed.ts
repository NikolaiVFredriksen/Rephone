import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("testpassord123", 10);

  const seller = await prisma.user.upsert({
    where: { email: "selger@rephone.no" },
    update: {},
    create: { email: "selger@rephone.no", passwordHash, name: "Test Selger" },
  });

  const listings = [
    {
      title: "iPhone 14 Pro, som ny",
      brand: "Apple",
      model: "iPhone 14 Pro",
      condition: "PENT_BRUKT" as const,
      price: 6900,
      description:
        "Kjøpt for tre måneder siden, alltid brukt med deksel og skjermbeskytter. Ingen riper. Batterihelse 98%.",
    },
    {
      title: "iPhone 13, god batteritid",
      brand: "Apple",
      model: "iPhone 13",
      condition: "PENT_BRUKT" as const,
      price: 3800,
      description:
        "Fungerer perfekt, batteriet holder fortsatt en hel dag. Noen få mikroriper på baksiden, ikke synlig med deksel.",
    },
    {
      title: "iPhone 12, billig og fin",
      brand: "Apple",
      model: "iPhone 12",
      condition: "BRUKT" as const,
      price: 2600,
      description:
        "Litt slitasje på kantene, skjermen er hel. Batteriet begynner å bli slitt, holder ca en halv dag med normal bruk.",
    },
    {
      title: "iPhone 11, budsjettvennlig",
      brand: "Apple",
      model: "iPhone 11",
      condition: "GODT_BRUKT" as const,
      price: 1800,
      description:
        "Synlige riper på skjerm og bakside, men fungerer som den skal. Perfekt som reservetelefon.",
    },
    {
      title: "iPhone SE 2022",
      brand: "Apple",
      model: "iPhone SE",
      condition: "PENT_BRUKT" as const,
      price: 2400,
      description:
        "Liten og kompakt, ingen skader. Kort batteritid selv når ny, verdt å vite.",
    },
    {
      title: "iPhone 14, nesten ny",
      brand: "Apple",
      model: "iPhone 14",
      condition: "NY" as const,
      price: 5900,
      description:
        "Ubrukt, fortsatt i original emballasje. Kjøpt som gave, passet ikke behovet.",
    },
    {
      title: "Samsung Galaxy S23, toppmodell",
      brand: "Samsung",
      model: "Galaxy S23",
      condition: "PENT_BRUKT" as const,
      price: 5200,
      description:
        "Kraftig kamera, god til bilder i mørket. Noen mikroriper på skjermen, merkes ikke i bruk.",
    },
    {
      title: "Samsung Galaxy S22",
      brand: "Samsung",
      model: "Galaxy S22",
      condition: "BRUKT" as const,
      price: 3400,
      description:
        "Skjermen har en liten sprekk i hjørnet, påvirker ikke funksjon. Batteritid er middels, holder en arbeidsdag.",
    },
    {
      title: "Samsung Galaxy A54, rimelig",
      brand: "Samsung",
      model: "Galaxy A54",
      condition: "PENT_BRUKT" as const,
      price: 2900,
      description:
        "Budsjettmodell i toppstand, kjøpt for få måneder siden. Utmerket batteritid, varer to dager med lett bruk.",
    },
    {
      title: "Samsung Galaxy S21",
      brand: "Samsung",
      model: "Galaxy S21",
      condition: "GODT_BRUKT" as const,
      price: 2100,
      description:
        "En del bruksmerker på rammen. Skjerm og kamera fungerer helt fint.",
    },
    {
      title: "Samsung Galaxy Z Flip 5",
      brand: "Samsung",
      model: "Galaxy Z Flip 5",
      condition: "PENT_BRUKT" as const,
      price: 6200,
      description:
        "Foldbar skjerm uten synlige linjer eller skader. Kompakt og lett å ha i lomma.",
    },
    {
      title: "Samsung Galaxy A34",
      brand: "Samsung",
      model: "Galaxy A34",
      condition: "BRUKT" as const,
      price: 1900,
      description:
        "Fungerer helt fint til hverdagsbruk. Litt langsom ved tunge apper.",
    },
    {
      title: "Google Pixel 8",
      brand: "Google",
      model: "Pixel 8",
      condition: "NY" as const,
      price: 4900,
      description:
        "Ubrukt, aldri tatt i bruk. Feilkjøp, byttet til en annen modell.",
    },
    {
      title: "Google Pixel 7a",
      brand: "Google",
      model: "Pixel 7a",
      condition: "PENT_BRUKT" as const,
      price: 3200,
      description:
        "Godt kamera til prisen. Batteritid holder en normal dag med moderat bruk.",
    },
    {
      title: "OnePlus 11",
      brand: "OnePlus",
      model: "11",
      condition: "PENT_BRUKT" as const,
      price: 3600,
      description:
        "Lynrask lading, fulladet på under en time. Skjerm og bakside i fin stand.",
    },
    {
      title: "Xiaomi Redmi Note 12",
      brand: "Xiaomi",
      model: "Redmi Note 12",
      condition: "GODT_BRUKT" as const,
      price: 1400,
      description:
        "Rimelig instegsmodell. Synlig slitasje, men fungerer stabilt til enkel bruk.",
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({
      data: { ...listing, sellerId: seller.id },
    });
  }

  console.log(`Seedet ${listings.length} annonser.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
