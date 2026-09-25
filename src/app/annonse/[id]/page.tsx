import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AnnonsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { email: true, name: true } } },
  });

  if (!listing) {
    notFound();
  }

  return (
    <main
      style={{ background: "#FBF7F0", minHeight: "100vh" }}
      className="px-6 py-10"
    >
      <div className="max-w-2xl mx-auto">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        ) : (
          <div
            style={{ background: "#F3DCD1", color: "#C4622E" }}
            className="w-full h-64 rounded-xl mb-6 flex items-center justify-center text-4xl font-medium"
          >
            {listing.brand[0]}
          </div>
        )}

        <h1 className="text-2xl font-medium" style={{ color: "#3A2E22" }}>
          {listing.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A7A68" }}>
          {listing.brand} {listing.model} · {listing.condition}
        </p>
        <p className="text-2xl mt-4" style={{ color: "#C4622E" }}>
          {listing.price}kr
        </p>

        <p className="mt-6" style={{ color: "#3A2E22" }}>
          {listing.description}
        </p>

        <div className="flex gap-3 mt-8">
          <a
            href={`mailto:${listing.seller.email}?subject=${encodeURIComponent("Interessert i " + listing.title)}`}
            style={{ background: "#C4622E", color: "#FBF7F0" }}
            className="px-5 py-2.5 rounded-full text-sm"
          >
            Kontakt selger{" "}
          </a>
        </div>
      </div>
    </main>
  );
}
