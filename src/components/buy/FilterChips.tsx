type Filters = {
  budget?: number;
  brand?: string;
  priorities?: string[];
};

type FilterChipsProps = {
  filters: Filters | null;
};

export default function FilterChips({ filters }: FilterChipsProps) {
  if (!filters) return null;

  return (
    <div className="flex gap-2 justify-center flex-wrap mb-6">
      {filters.budget && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          Budsjett: {filters.budget}kr
        </span>
      )}
      {filters.brand && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          {filters.brand}
        </span>
      )}
      {filters.priorities?.map((p) => (
        <span
          key={p}
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}
