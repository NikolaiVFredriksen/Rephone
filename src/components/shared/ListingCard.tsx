import Link from "next/link";

export type Listing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  imageUrl?: string | null;
  batteryHealth?: number | null;
  storage?: number | null;
  reason?: string;
};

const CONDITION_LABELS: Record<string, string> = {
  NY: "Ny",
  PENT_BRUKT: "Pent brukt",
  BRUKT: "Brukt",
  GODT_BRUKT: "Godt brukt",
};

function storageLabel(gb: number) {
  return gb === 1024 ? "1TB" : `${gb}GB`;
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const details = [
    CONDITION_LABELS[listing.condition] ?? listing.condition,
    listing.storage && storageLabel(listing.storage),
    listing.batteryHealth && `${listing.batteryHealth}%`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/annonse/${listing.id}`} className="block group">
      <div
        style={{
          background: listing.imageUrl ? undefined : "#F3DCD1",
        }}
        className="w-full aspect-[4/5] rounded-xl overflow-hidden mb-2 relative"
      >
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div
            style={{ color: "#C4622E" }}
            className="w-full h-full flex items-center justify-center text-4xl font-medium"
          >
            {listing.brand[0]}
          </div>
        )}
        <div
          style={{ background: "white", color: "#3A2E22" }}
          className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium shadow"
        >
          {listing.price.toLocaleString("no")}kr
        </div>
      </div>

      <p
        className="text-sm font-bold leading-tight"
        style={{ color: "#3A2E22" }}
      >
        {listing.model}
      </p>
      <p className="text-sm leading-tight mt-0.5" style={{ color: "#A69581" }}>
        {details}
      </p>
    </Link>
  );
}
