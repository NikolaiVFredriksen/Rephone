export default function ListingCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div
        style={{ background: "#F3DCD1" }}
        className="w-full aspect-[4/5] rounded-xl overflow-hidden mb-2 animate-pulse"
      />
      <div
        style={{ background: "#E9DCCB" }}
        className="h-3.5 w-3/4 rounded-full mb-1.5 animate-pulse"
      />
      <div
        style={{ background: "#E9DCCB" }}
        className="h-3 w-1/2 rounded-full animate-pulse"
      />
    </div>
  );
}
