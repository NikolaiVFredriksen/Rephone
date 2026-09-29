import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }

  if (existing.sellerId !== session.user.id) {
    return NextResponse.json(
      { error: "Du eier ikke denne annonsen" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const {
    title,
    brand,
    model,
    condition,
    price,
    description,
    imageUrl,
    status,
    batteryHealth,
    storage,
  } = body;

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title,
      brand,
      model,
      condition,
      price,
      description,
      imageUrl,
      status,
      batteryHealth,
      storage,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }

  if (existing.sellerId !== session.user.id) {
    return NextResponse.json(
      { error: "Du eier ikke denne annonsen" },
      { status: 403 },
    );
  }

  await prisma.listing.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
