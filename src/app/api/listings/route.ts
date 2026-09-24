import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: "AKTIV" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const { title, brand, model, condition, price, description, imageUrl } =
    await req.json();

  if (!title || !brand || !model || !condition || !price || !description) {
    return NextResponse.json({ error: "Mangler felt" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      title,
      brand,
      model,
      condition,
      price,
      description,
      imageUrl,
      sellerId: session.user.id,
    },
  });

  return NextResponse.json(listing);
}
