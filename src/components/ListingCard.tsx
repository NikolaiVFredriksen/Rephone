import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  imageUrl?: string | null;
  reason?: string;
};

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
        {listing.brand} {listing.model} · {listing.condition}
      </p>
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
