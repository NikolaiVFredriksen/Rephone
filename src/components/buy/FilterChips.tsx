type Filters = {
  budget?: number;
  minPrice?: number;
  brand?: string;
  model?: string;
  minBatteryHealth?: number;
  minStorage?: number;
  conditions?: string[];
  priorities?: string[];
};

const CONDITION_LABELS: Record<string, string> = {
  NY: "Ny",
  PENT_BRUKT: "Pent brukt",
  BRUKT: "Brukt",
  GODT_BRUKT: "Godt brukt",
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
      {filters.minPrice && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          Fra {filters.minPrice}kr
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
      {filters.model && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          {filters.model}
        </span>
      )}
      {filters.conditions?.map((c) => (
        <span
          key={c}
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#F3DCD1", color: "#8A4A2E" }}
        >
          {CONDITION_LABELS[c] ?? c}
        </span>
      ))}
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
