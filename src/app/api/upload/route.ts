import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget" },
      { status: 401 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Mangler fil" }, { status: 400 });
  }

  try {
    const blob = await put(
      `listings/${session.user.id}-${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
      },
    );

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload failed:", err);
    return NextResponse.json(
      { error: "Opplasting feilet, prøv igjen" },
      { status: 500 },
    );
  }
}
