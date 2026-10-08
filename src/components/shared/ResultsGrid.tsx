import ListingCard, { type Listing } from "./ListingCard";

type ResultsGridProps = {
  results: Listing[];
};

export default function ResultsGrid({ results }: ResultsGridProps) {
  return (
    <div className="results-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {results.map((r, i) => (
        <div
          key={r.id}
          className="fade-in-up"
          style={{ "--enter-delay": `${Math.min(i, 11) * 40}ms` } as React.CSSProperties}
        >
          <ListingCard listing={r} />
        </div>
      ))}
    </div>
  );
}
