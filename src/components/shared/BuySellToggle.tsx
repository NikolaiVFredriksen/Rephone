"use client";

type Mode = "kjop" | "selg";

type BuySellToggleProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function BuySellToggle({ mode, onChange }: BuySellToggleProps) {
  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="flex gap-2 justify-center mb-4">
        <button
          type="button"
          onClick={() => onChange("kjop")}
          style={{
            background: mode === "kjop" ? "#C4622E" : "transparent",
            color: mode === "kjop" ? "#FBF7F0" : "#8A7A68",
            border: mode === "kjop" ? "none" : "1px dashed #C9A98D",
          }}
          className="px-4 py-1.5 rounded-full text-sm"
        >
          Kjøp
        </button>
        <button
          type="button"
          onClick={() => onChange("selg")}
          style={{
            background: mode === "selg" ? "#C4622E" : "transparent",
            color: mode === "selg" ? "#FBF7F0" : "#8A7A68",
            border: mode === "selg" ? "none" : "1px dashed #C9A98D",
          }}
          className="px-4 py-1.5 rounded-full text-sm"
        >
          Selg
        </button>
      </div>
    </div>
  );
}
