import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Brukes når du ikke har lagt inn et eget bilde for annonsen ennå.
const BLOB =
  "https://wwtql6mufnaky56v.public.blob.vercel-storage.com/listings/cmumffemw0007hcxfrgnb9qf1-";
const IMG = {
  iphone12: `${BLOB}1790682476973-iphone12.avif`,
  iphone13: `${BLOB}1790682317556-iphone13.avif`,
  iphone14: `${BLOB}1790683132247-iphone14.avif`,
  iphone15: `${BLOB}1790681617215-iphone15.avif`,
  iphone16: `${BLOB}1790682171820-iphone16.avif`,
  s22: `${BLOB}1790682630855-s22.avif`,
  s24: `${BLOB}1790682698482-s24.avif`,
  pixel7: `${BLOB}1790682938750-pixel7.avif`,
  xiaomi: `${BLOB}1790683004308-xiaomi.avif`,
};

type Cond = "NY" | "PENT_BRUKT" | "BRUKT" | "GODT_BRUKT";

const LISTINGS: {
  brand: string;
  model: string;
  condition: Cond;
  storage: number;
  battery: number | null;
  price: number;
  img: string;
  text: string;
}[] = [
  // 01
  {
    brand: "Apple",
    model: "iPhone 13",
    condition: "PENT_BRUKT",
    storage: 128,
    battery: 89,
    price: 3300,
    img: IMG.iphone13,
    text: "Brukt med deksel og skjermbeskytter hele tiden. Ingen synlige riper.",
  },
  // 02
  {
    brand: "Samsung",
    model: "Galaxy S23",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 90,
    price: 3800,
    img: IMG.s22,
    text: "Pent brukt med mye lagring. Alltid brukt med deksel.",
  },
  // 03
  {
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 91,
    price: 5100,
    img: IMG.iphone13,
    text: "Stor skjerm og godt batteri. Pent behandlet uten skader.",
  },
  // 04
  {
    brand: "Apple",
    model: "iPhone 15",
    condition: "PENT_BRUKT",
    storage: 128,
    battery: 94,
    price: 5000,
    img: IMG.iphone15,
    text: "Lite brukt og alltid hatt deksel. Batteriet er fortsatt veldig bra.",
  },
  // 05
  {
    brand: "Google",
    model: "Pixel 8",
    condition: "PENT_BRUKT",
    storage: 128,
    battery: 92,
    price: 3600,
    img: IMG.pixel7,
    text: "Rent Android og godt kamera. Pent behandlet.",
  },
  // 06
  {
    brand: "Apple",
    model: "iPhone 12",
    condition: "GODT_BRUKT",
    storage: 64,
    battery: null,
    price: 1700,
    img: IMG.iphone12,
    text: "Tydelig brukt med riper på baksiden. Skjermen er hel og alt virker.",
  },
  // 07
  {
    brand: "Apple",
    model: "iPhone 17",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 97,
    price: 7500,
    img: IMG.iphone16,
    text: "Nesten som ny. Brukt i noen måneder uten riper eller merker.",
  },
  // 08
  {
    brand: "Samsung",
    model: "Galaxy S24",
    condition: "GODT_BRUKT",
    storage: 128,
    battery: null,
    price: 4100,
    img: IMG.s24,
    text: "Bruksmerker på rammen. Skjerm og kamera fungerer helt fint.",
  },
  // 09
  {
    brand: "Apple",
    model: "iPhone 14",
    condition: "PENT_BRUKT",
    storage: 128,
    battery: 90,
    price: 4100,
    img: IMG.iphone14,
    text: "Pent brukt og i god stand. Selges fordi jeg har byttet telefon.",
  },
  // 10
  {
    brand: "Samsung",
    model: "Galaxy S25",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 97,
    price: 6300,
    img: IMG.s24,
    text: "Nesten ny. Brukt i kort tid og alltid beskyttet.",
  },
  // 11
  {
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    condition: "BRUKT",
    storage: 128,
    battery: null,
    price: 4300,
    img: IMG.iphone13,
    text: "Fungerer fint. Normale bruksspor etter noen års bruk.",
  },
  // 12
  {
    brand: "Xiaomi",
    model: "Xiaomi 13",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 88,
    price: 2700,
    img: IMG.xiaomi,
    text: "God telefon til en lav pris. Pent brukt uten skader.",
  },
  // 13
  {
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 92,
    price: 7600,
    img: IMG.iphone15,
    text: "Stor skjerm og veldig godt kamera. Brukt med deksel hele tiden.",
  },
  // 14
  {
    brand: "Apple",
    model: "iPhone 13",
    condition: "BRUKT",
    storage: 128,
    battery: 81,
    price: 2800,
    img: IMG.iphone13,
    text: "Fungerer som den skal. Noen bruksspor og batteriet har gått litt ned.",
  },
  // 15
  {
    brand: "Xiaomi",
    model: "Redmi Note 12",
    condition: "BRUKT",
    storage: 128,
    battery: null,
    price: 1100,
    img: IMG.xiaomi,
    text: "Enkel og grei telefon. Fungerer fint, men har bruksspor.",
  },
  // 16
  {
    brand: "Apple",
    model: "iPhone 16",
    condition: "PENT_BRUKT",
    storage: 128,
    battery: 95,
    price: 5400,
    img: IMG.iphone16,
    text: "Brukt med deksel og skjermbeskytter fra første dag. Ingen riper.",
  },
  // 17
  {
    brand: "Apple",
    model: "iPhone 17",
    condition: "PENT_BRUKT",
    storage: 256,
    battery: 94,
    price: 7100,
    img: IMG.iphone16,
    text: "Veldig pent brukt og i god stand. Selges fordi jeg skal bytte til en Pro.",
  },
];

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Laster opp annonser/NN.<ext> til Blob. Returnerer null hvis filen ikke finnes.
async function uploadImage(i: number): Promise<string | null> {
  const nn = String(i + 1).padStart(2, "0");
  for (const ext of Object.keys(TYPES)) {
    const path = `annonser/${nn}.${ext}`;
    if (!existsSync(path)) continue;
    const blob = await put(`listings/seed-${nn}.${ext}`, readFileSync(path), {
      access: "public",
      contentType: TYPES[ext],
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }
  return null;
}

async function main() {
  // Eier: brukeren med flest annonser fra før. Overstyr med SELLER_ID i .env.
  const top = await prisma.listing.groupBy({
    by: ["sellerId"],
    _count: { _all: true },
    orderBy: { _count: { sellerId: "desc" } },
    take: 1,
  });
  const sellerId = process.env.SELLER_ID ?? top[0]?.sellerId;
  if (!sellerId) throw new Error("Fant ingen selger. Sett SELLER_ID i .env.");

  let added = 0;
  let updated = 0;
  const now = Date.now();

  for (const [i, l] of LISTINGS.entries()) {
    const uploaded = await uploadImage(i);

    const exists = await prisma.listing.findFirst({
      where: { sellerId, model: l.model, price: l.price, storage: l.storage },
    });

    if (exists) {
      // Kjør på nytt etter at du har lagt til flere bilder: bare bildet byttes.
      if (uploaded) {
        await prisma.listing.update({
          where: { id: exists.id },
          data: { imageUrl: uploaded },
        });
        updated++;
      }
      continue;
    }

    await prisma.listing.create({
      data: {
        title: l.model.startsWith(l.brand) ? l.model : `${l.brand} ${l.model}`,
        brand: l.brand,
        model: l.model,
        condition: l.condition,
        price: l.price,
        storage: l.storage,
        batteryHealth: l.battery,
        description: l.text,
        imageUrl: uploaded ?? l.img,
        status: "AKTIV",
        sellerId,
        createdAt: new Date(now - i * 7 * 60 * 60 * 1000),
      },
    });
    added++;
  }

  console.log(
    `Lagt til ${added}, oppdatert bilde på ${updated}. Selger: ${sellerId}`,
  );
}

main().finally(() => prisma.$disconnect());
