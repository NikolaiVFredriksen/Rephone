import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const CONDITION_LABELS: Record<string, string> = {
  NY: "Ny",
  PENT_BRUKT: "Pent brukt",
  BRUKT: "Brukt",
  GODT_BRUKT: "Godt brukt",
};

function storageLabel(gb: number) {
  return gb === 1024 ? "1TB" : `${gb}GB`;
}

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

  const facts = [
    {
      label: "Tilstand",
      value: CONDITION_LABELS[listing.condition] ?? listing.condition,
    },
    listing.storage && {
      label: "Lagring",
      value: storageLabel(listing.storage),
    },
    listing.batteryHealth && {
      label: "Batterihelse",
      value: `${listing.batteryHealth}%`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div
          style={{
            background: "white",
            border: "1px solid #E9DCCB",
            borderRadius: 24,
          }}
          className="p-8 flex gap-10"
        >
          <div className="w-1/2 shrink-0 aspect-[4/5] rounded-2xl overflow-hidden relative">
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                style={{ background: "#F3DCD1", color: "#C4622E" }}
                className="w-full h-full flex items-center justify-center text-5xl font-medium"
              >
                {listing.brand[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm" style={{ color: "#A69581" }}>
              {listing.brand}
            </p>
            <h1
              className="text-3xl font-bold leading-tight mt-1"
              style={{ color: "#3A2E22" }}
            >
              {listing.model}
            </h1>
            <p className="text-2xl font-bold mt-3" style={{ color: "#C4622E" }}>
              {listing.price.toLocaleString("no")}kr
            </p>

            <div className="h-px my-6" style={{ background: "#E9DCCB" }} />

            <div className="space-y-3">
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span style={{ color: "#8A7A68" }}>{f.label}</span>
                  <span className="font-medium" style={{ color: "#3A2E22" }}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px my-6" style={{ background: "#E9DCCB" }} />

            <p className="text-sm leading-relaxed" style={{ color: "#3A2E22" }}>
              {listing.description}
            </p>

            <a
              href={`mailto:${listing.seller.email}?subject=${encodeURIComponent("Interessert i " + listing.title)}`}
              style={{ background: "#C4622E", color: "#FBF7F0" }}
              className="block text-center mt-6 px-5 py-3 rounded-full text-sm font-medium"
            >
              Kontakt selger
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
