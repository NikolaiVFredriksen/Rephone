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
          className={`px-4 py-1.5 rounded-full text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] ${
            mode === "kjop"
              ? "bg-[#C4622E] text-[#FBF7F0] border border-transparent"
              : "bg-transparent text-[#8A7A68] border border-dashed border-[#C9A98D] hover:border-[#C4622E] hover:text-[#C4622E]"
          }`}
        >
          Kjøp
        </button>
        <button
          type="button"
          onClick={() => onChange("selg")}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] ${
            mode === "selg"
              ? "bg-[#C4622E] text-[#FBF7F0] border border-transparent"
              : "bg-transparent text-[#8A7A68] border border-dashed border-[#C9A98D] hover:border-[#C4622E] hover:text-[#C4622E]"
          }`}
        >
          Selg
        </button>
      </div>
    </div>
  );
}
