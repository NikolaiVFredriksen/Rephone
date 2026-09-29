"use client";

import { useState } from "react";

type Draft = {
  brand: string;
  model: string;
  condition: string;
  price: number;
  description: string;
  reasoning: string;
  batteryHealth: number | null;
  storage: number | null;
};

type EditDraftStepProps = {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  onContinue: () => void;
};

const CONDITIONS = [
  { value: "NY", label: "Ny" },
  { value: "PENT_BRUKT", label: "Pent brukt" },
  { value: "BRUKT", label: "Brukt" },
  { value: "GODT_BRUKT", label: "Godt brukt" },
];

const STORAGE_OPTIONS = [64, 128, 256, 512, 1024];

function storageLabel(gb: number) {
  return gb === 1024 ? "1TB" : `${gb}GB`;
}

export default function EditDraftStep({
  draft,
  onDraftChange,
  onContinue,
}: EditDraftStepProps) {
  const [adjusting, setAdjusting] = useState(false);

  async function handleStorageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStorage = e.target.value ? Number(e.target.value) : null;
    onDraftChange({ ...draft, storage: newStorage });

    if (!newStorage) return;

    setAdjusting(true);
    try {
      const res = await fetch("/api/adjust-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: draft.brand,
          model: draft.model,
          condition: draft.condition,
          storage: newStorage,
          batteryHealth: draft.batteryHealth,
        }),
      });
      const data = await res.json();
      if (data.price) {
        onDraftChange({
          ...draft,
          storage: newStorage,
          price: data.price,
          reasoning: data.reasoning ?? draft.reasoning,
        });
      }
    } catch {
      // stille feil, beholder eksisterende pris
    } finally {
      setAdjusting(false);
    }
  }

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
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Merke
            </p>
            <input
              value={draft.brand}
              onChange={(e) =>
                onDraftChange({ ...draft, brand: e.target.value })
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
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Modell
            </p>
            <input
              value={draft.model}
              onChange={(e) =>
                onDraftChange({ ...draft, model: e.target.value })
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
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Tilstand
            </p>
            <select
              value={draft.condition}
              onChange={(e) =>
                onDraftChange({ ...draft, condition: e.target.value })
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
            >
              <option value="">Velg tilstand</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Pris (kr)
            </p>
            <input
              value={String(draft.price)}
              onChange={(e) =>
                onDraftChange({ ...draft, price: Number(e.target.value) })
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
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Lagring
            </p>
            <select
              value={draft.storage ?? ""}
              onChange={handleStorageChange}
              disabled={adjusting}
              style={{
                border: "1px solid #E9DCCB",
                background: "#FBF7F0",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                width: "100%",
                color: "#3A2E22",
              }}
            >
              <option value="">Velg lagring</option>
              {STORAGE_OPTIONS.map((gb) => (
                <option key={gb} value={gb}>
                  {storageLabel(gb)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "#A69581" }}>
              Batterihelse (%)
            </p>
            <input
              placeholder="f.eks. 91"
              value={draft.batteryHealth ?? ""}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  batteryHealth: e.target.value ? Number(e.target.value) : null,
                })
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
            {adjusting ? "Oppdaterer prisforslag..." : draft.reasoning}
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
