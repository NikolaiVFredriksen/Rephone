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

function batteryLabel(health: number) {
  if (health >= 90) return "Meget god batterihelse";
  if (health >= 80) return "God batterihelse";
  if (health >= 70) return "Grei batterihelse";
  return "Svak batterihelse";
}

function storageLabel(gb: number) {
  return gb === 1024 ? "1TB" : `${gb}GB`;
}

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/annonse/${listing.id}`}
      style={{ border: "1px solid #E9DCCB", background: "white" }}
      className="rounded-xl p-4 block hover:opacity-90 transition"
    >
      {listing.imageUrl ? (
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      ) : (
        <div
          style={{ background: "#F3DCD1", color: "#C4622E" }}
          className="w-full h-32 rounded-lg mb-3 flex items-center justify-center text-2xl font-medium"
        >
          {listing.brand[0]}
        </div>
      )}

      <p className="font-medium" style={{ color: "#3A2E22" }}>
        {listing.title}
      </p>
      <p className="text-sm" style={{ color: "#8A7A68" }}>
        {listing.brand} {listing.model} ·{" "}
        {CONDITION_LABELS[listing.condition] ?? listing.condition}
      </p>
      {(listing.storage || listing.batteryHealth) && (
        <p className="text-xs mt-1" style={{ color: "#A69581" }}>
          {listing.storage && storageLabel(listing.storage)}
          {listing.storage && listing.batteryHealth && " · "}
          {listing.batteryHealth && batteryLabel(listing.batteryHealth)}
        </p>
      )}
      <p className="mt-1" style={{ color: "#C4622E" }}>
        {listing.price}kr
      </p>
      {listing.reason && (
        <p className="text-xs mt-2" style={{ color: "#A69581" }}>
          {listing.reason}
        </p>
      )}
    </Link>
  );
}
