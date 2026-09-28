type Draft = {
  brand: string;
  model: string;
  condition: string;
  price: number;
  description: string;
  reasoning: string;
};

type EditDraftStepProps = {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  onContinue: () => void;
};

export default function EditDraftStep({
  draft,
  onDraftChange,
  onContinue,
}: EditDraftStepProps) {
  return (
    <div className="max-w-xl mx-auto mt-8">
      <div
        style={{
          background: "white",
          border: "1px solid #E9DCCB",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <p className="text-xs mb-4" style={{ color: "#8A7A68" }}>
          AI-forslag, juster det som ikke stemmer
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Merke", key: "brand" },
            { label: "Modell", key: "model" },
            { label: "Tilstand", key: "condition" },
            { label: "Pris (kr)", key: "price" },
          ].map(({ label, key }) => (
            <div key={key}>
              <p className="text-xs mb-1" style={{ color: "#A69581" }}>
                {label}
              </p>
              <input
                value={String(draft[key as keyof typeof draft])}
                onChange={(e) =>
                  onDraftChange({ ...draft, [key]: e.target.value })
                }
                style={{
                  border: "1px solid #E9DCCB",
                  background: "#FBF7F0",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  width: "100%",
                  color: "#3A2E22",
                }}
              />
            </div>
          ))}
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Lagring
            </p>
            <input
              placeholder="f.eks. 128GB"
              style={{
                border: "1px solid #E9DCCB",
                background: "#FBF7F0",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                width: "100%",
                color: "#3A2E22",
              }}
            />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Batterihelse
            </p>
            <input
              placeholder="f.eks. 91%"
              style={{
                border: "1px solid #E9DCCB",
                background: "#FBF7F0",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                width: "100%",
                color: "#3A2E22",
              }}
            />
          </div>
        </div>
        <div
          style={{
            background: "#F3DCD1",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <p className="text-xs" style={{ color: "#8A4A2E" }}>
            {draft.reasoning}
          </p>
          <p className="text-lg font-medium mt-1" style={{ color: "#C4622E" }}>
            {draft.price.toLocaleString("no")} kr
          </p>
        </div>
        <button
          onClick={onContinue}
          style={{ background: "#C4622E", color: "#FBF7F0" }}
          className="w-full rounded-full py-2.5 text-sm"
        >
          Fortsett
        </button>
      </div>
    </div>
  );
}
