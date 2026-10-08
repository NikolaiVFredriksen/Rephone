"use client";

import { useState } from "react";
import Spinner from "../shared/Spinner";

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

  async function refreshPrice(updated: Draft) {
    if (!updated.brand || !updated.model || !updated.condition) return;

    setAdjusting(true);
    try {
      const res = await fetch("/api/adjust-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: updated.brand,
          model: updated.model,
          condition: updated.condition,
          storage: updated.storage,
          batteryHealth: updated.batteryHealth,
        }),
      });
      const data = await res.json();
      if (data.price) {
        onDraftChange({
          ...updated,
          price: data.price,
          reasoning: data.reasoning ?? updated.reasoning,
        });
      }
    } catch {
      // stille feil, beholder eksisterende pris
    } finally {
      setAdjusting(false);
    }
  }

  function handleFieldChange(
    field: keyof Draft,
    value: string | number | null,
  ) {
    const updated = { ...draft, [field]: value };
    onDraftChange(updated);
    refreshPrice(updated);
  }

  return (
    <div className="max-w-xl mx-auto mt-8 fade-in-up">
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
              onBlur={() => refreshPrice(draft)}
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
              onBlur={() => refreshPrice(draft)}
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
              onChange={(e) => handleFieldChange("condition", e.target.value)}
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
              onChange={(e) =>
                handleFieldChange(
                  "storage",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
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
              onBlur={() => refreshPrice(draft)}
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
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-xs"
            style={{ color: "#8A4A2E" }}
          >
            {adjusting && <Spinner size={12} />}
            <span aria-hidden={adjusting}>
              {adjusting ? "Oppdaterer prisforslag..." : draft.reasoning}
            </span>
            {adjusting && <span className="sr-only">Oppdaterer pris...</span>}
          </div>
          <p
            className="text-lg font-medium mt-1 transition-opacity"
            style={{ color: "#C4622E", opacity: adjusting ? 0.5 : 1 }}
          >
            {draft.price.toLocaleString("no")} kr
          </p>
        </div>
        <button
          onClick={onContinue}
          className="w-full rounded-full py-2.5 text-sm bg-[#C4622E] text-[#FBF7F0] transition-colors hover:bg-[#A8521F] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Fortsett
        </button>
      </div>
    </div>
  );
}
