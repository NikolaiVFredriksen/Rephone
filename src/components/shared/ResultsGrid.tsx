import ListingCard, { type Listing } from "./ListingCard";

type ResultsGridProps = {
  results: Listing[];
};

export default function ResultsGrid({ results }: ResultsGridProps) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      }}
    >
      {results.map((r) => (
        <ListingCard key={r.id} listing={r} />
      ))}
    </div>
  );
}
