type Filters = {
  budget?: number;
  brand?: string;
  minBatteryHealth?: number;
  minStorage?: number;
  priorities?: string[];
};

type FilterChipsProps = {
  filters: Filters | null;
};

function storageLabel(gb: number) {
  return gb === 1024 ? "1TB" : `${gb}GB`;
}

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
      {filters.minBatteryHealth && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          Min. {filters.minBatteryHealth}% batteri
        </span>
      )}
      {filters.minStorage && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          Min. {storageLabel(filters.minStorage)}
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
