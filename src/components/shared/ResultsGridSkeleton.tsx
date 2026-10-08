import ListingCardSkeleton from "./ListingCardSkeleton";

export default function ResultsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="results-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
