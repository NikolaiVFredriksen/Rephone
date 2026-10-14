"use client";

import { useState } from "react";
import Spinner from "../shared/Spinner";
import Badge from "../shared/Badge";
import type { Draft } from "./types";

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

function fieldStyle(filled: boolean): React.CSSProperties {
  return {
    border: filled ? "1px solid #E9DCCB" : "1px solid #C4622E",
    background: "#FBF7F0",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    width: "100%",
    color: "#3A2E22",
  };
}

function FieldLabel({ text, filled }: { text: string; filled: boolean }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs" style={{ color: "#A69581" }}>
        {text}
      </p>
      <Badge tone={filled ? "suggested" : "missing"}>
        {filled ? "Foreslått" : "Fyll inn"}
      </Badge>
    </div>
  );
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

  const canContinue =
    !!draft.brand && !!draft.model && !!draft.condition && draft.price > 0;

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
        <h2 className="text-lg font-medium mb-1" style={{ color: "#3A2E22" }}>
          Sjekk utkastet
        </h2>
        <p className="text-xs mb-4" style={{ color: "#8A7A68" }}>
          Vi har fylt ut dette ut fra beskrivelsen din. Rett det som er feil.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <FieldLabel text="Merke" filled={!!draft.brand} />
            <input
              value={draft.brand}
              onChange={(e) =>
                onDraftChange({ ...draft, brand: e.target.value })
              }
              onBlur={() => refreshPrice(draft)}
              style={fieldStyle(!!draft.brand)}
            />
          </div>
          <div>
            <FieldLabel text="Modell" filled={!!draft.model} />
            <input
              value={draft.model}
              onChange={(e) =>
                onDraftChange({ ...draft, model: e.target.value })
              }
              onBlur={() => refreshPrice(draft)}
              style={fieldStyle(!!draft.model)}
            />
          </div>
          <div>
            <FieldLabel text="Tilstand" filled={!!draft.condition} />
            <select
              value={draft.condition}
              onChange={(e) => handleFieldChange("condition", e.target.value)}
              disabled={adjusting}
              style={fieldStyle(!!draft.condition)}
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
            <FieldLabel text="Lagring" filled={!!draft.storage} />
            <select
              value={draft.storage ?? ""}
              onChange={(e) =>
                handleFieldChange(
                  "storage",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              disabled={adjusting}
              style={fieldStyle(!!draft.storage)}
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
            <FieldLabel
              text="Batterihelse (%)"
              filled={draft.batteryHealth !== null}
            />
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
              style={fieldStyle(draft.batteryHealth !== null)}
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
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs" style={{ color: "#8A4A2E" }}>
              Foreslått pris
            </p>
            {adjusting && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5"
              >
                <Spinner size={11} />
                <span className="sr-only">Oppdaterer pris...</span>
              </div>
            )}
          </div>
          <p
            className="text-lg font-medium transition-opacity"
            style={{ color: "#C4622E", opacity: adjusting ? 0.5 : 1 }}
          >
            {draft.price.toLocaleString("no")} kr
          </p>
          <p className="text-xs mt-1" style={{ color: "#8A4A2E" }}>
            {adjusting ? "Oppdaterer prisforslag..." : draft.reasoning}
          </p>
        </div>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full rounded-full py-2.5 text-sm bg-[#C4622E] text-[#FBF7F0] transition-colors hover:bg-[#A8521F] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#C4622E]"
        >
          Fortsett
        </button>
        {!canContinue && (
          <p className="text-xs text-center mt-2" style={{ color: "#8A4A2E" }}>
            Merke, modell, tilstand og pris må være fylt ut for å fortsette
          </p>
        )}
      </div>
    </div>
  );
}
