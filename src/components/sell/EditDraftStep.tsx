"use client";

import { useEffect, useRef, useState } from "react";
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

const DEBOUNCE_MS = 600;

type PriceMode = "full" | "base";

type Baseline = {
  price: number;
  storage: number | null;
  batteryHealth: number | null;
};

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

function isValidBatteryHealth(value: number | null) {
  return (
    value === null || (!Number.isNaN(value) && value >= 0 && value <= 100)
  );
}

export default function EditDraftStep({
  draft,
  onDraftChange,
  onContinue,
}: EditDraftStepProps) {
  const [adjusting, setAdjusting] = useState(false);
  const [priceSource, setPriceSource] = useState<"system" | "user">("system");
  const [pendingPrice, setPendingPrice] = useState<{
    price: number;
    reasoning: string;
  } | null>(null);
  const [priceError, setPriceError] = useState("");

  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const baselineRef = useRef<Baseline>({
    price: draft.price,
    storage: draft.storage,
    batteryHealth: draft.batteryHealth,
  });
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceSourceRef = useRef(priceSource);
  priceSourceRef.current = priceSource;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  async function refreshPrice(updated: Draft, mode: PriceMode) {
    if (!updated.brand || !updated.model || !updated.condition) return;
    if (!isValidBatteryHealth(updated.batteryHealth)) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAdjusting(true);
    setPriceError("");

    const baseline = baselineRef.current;
    const body: Record<string, unknown> = {
      brand: updated.brand,
      model: updated.model,
      condition: updated.condition,
      storage: updated.storage,
      batteryHealth: updated.batteryHealth,
    };
    if (
      mode === "base" &&
      typeof baseline.price === "number" &&
      !Number.isNaN(baseline.price)
    ) {
      body.basePrice = baseline.price;
      body.baseStorage = baseline.storage;
      body.baseBatteryHealth = baseline.batteryHealth;
    }

    try {
      const res = await fetch("/api/adjust-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 404) {
        setPriceError("Fant ikke grunnlag for ny pris, juster selv");
        return;
      }
      if (!res.ok) {
        console.error("Kunne ikke oppdatere prisforslag:", res.status);
        return;
      }

      const data = await res.json();
      if (typeof data.price !== "number" || Number.isNaN(data.price)) return;

      baselineRef.current = {
        price: data.price,
        storage: updated.storage,
        batteryHealth: updated.batteryHealth,
      };

      if (priceSourceRef.current === "user") {
        setPendingPrice({ price: data.price, reasoning: data.reasoning ?? "" });
      } else {
        onDraftChange({
          ...draftRef.current,
          price: data.price,
          reasoning: data.reasoning ?? draftRef.current.reasoning,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Kunne ikke oppdatere prisforslag:", err);
    } finally {
      if (abortRef.current === controller) setAdjusting(false);
    }
  }

  function applyFieldUpdate(field: keyof Draft, value: string | number | null) {
    const updated = { ...draftRef.current, [field]: value };
    onDraftChange(updated);
    return updated;
  }

  function handleImmediateChange(
    field: keyof Draft,
    value: string | number | null,
    mode: PriceMode,
  ) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const updated = applyFieldUpdate(field, value);
    refreshPrice(updated, mode);
  }

  function handleDebouncedChange(
    field: keyof Draft,
    value: string | number | null,
    mode: PriceMode,
  ) {
    applyFieldUpdate(field, value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refreshPrice(draftRef.current, mode);
    }, DEBOUNCE_MS);
  }

  function handlePriceInputChange(value: string) {
    const parsed = Number(value);
    onDraftChange({
      ...draftRef.current,
      price: Number.isNaN(parsed) ? 0 : parsed,
    });
    setPriceSource("user");
  }

  function applyPendingPrice() {
    if (!pendingPrice) return;
    onDraftChange({
      ...draftRef.current,
      price: pendingPrice.price,
      reasoning: pendingPrice.reasoning,
    });
    setPendingPrice(null);
    setPriceSource("system");
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
                handleDebouncedChange("brand", e.target.value, "full")
              }
              style={fieldStyle(!!draft.brand)}
            />
          </div>
          <div>
            <FieldLabel text="Modell" filled={!!draft.model} />
            <input
              value={draft.model}
              onChange={(e) =>
                handleDebouncedChange("model", e.target.value, "full")
              }
              style={fieldStyle(!!draft.model)}
            />
          </div>
          <div>
            <FieldLabel text="Tilstand" filled={!!draft.condition} />
            <select
              value={draft.condition}
              onChange={(e) =>
                handleImmediateChange("condition", e.target.value, "full")
              }
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
                handleImmediateChange(
                  "storage",
                  e.target.value ? Number(e.target.value) : null,
                  "base",
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
                handleDebouncedChange(
                  "batteryHealth",
                  e.target.value ? Number(e.target.value) : null,
                  "base",
                )
              }
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
          <div
            className="flex items-baseline gap-1.5 transition-opacity"
            style={{ opacity: adjusting ? 0.5 : 1 }}
          >
            <input
              value={String(draft.price)}
              onChange={(e) => handlePriceInputChange(e.target.value)}
              inputMode="numeric"
              aria-label="Foreslått pris i kroner"
              className="text-lg font-medium bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] rounded"
              style={{ color: "#C4622E", width: "7ch" }}
            />
            <span className="text-lg font-medium" style={{ color: "#C4622E" }}>
              kr
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "#8A4A2E" }}>
            {priceError
              ? priceError
              : adjusting
                ? "Oppdaterer prisforslag..."
                : draft.reasoning}
          </p>
          {pendingPrice && (
            <button
              type="button"
              onClick={applyPendingPrice}
              className="text-xs mt-1.5 underline outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] rounded"
              style={{ color: "#8A4A2E" }}
            >
              Bruk foreslått pris ({pendingPrice.price.toLocaleString("no")}{" "}
              kr)
            </button>
          )}
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
