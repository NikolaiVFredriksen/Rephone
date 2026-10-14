"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import EditDraftStep from "./EditDraftStep";
import GenerateDescription from "./GenerateDescription";
import StepIndicator from "./StepIndicator";
import DraftSkeleton from "./DraftSkeleton";
import type { Draft } from "./types";

const MIN_DESCRIPTION_LENGTH = 3;

export default function SellFlow() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim().length < MIN_DESCRIPTION_LENGTH) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/price-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input }),
      });
      const data = await res.json();
      if (data.priceRange) {
        setDraft({
          brand: data.parsed?.brand ?? "",
          model: data.parsed?.model ?? "",
          condition: data.parsed?.condition ?? "",
          price: data.priceRange.low,
          description: "",
          reasoning: data.reasoning ?? "",
          batteryHealth: data.parsed?.batteryHealth ?? null,
          storage: data.parsed?.storage ?? null,
        });
        setStep(2);
      } else {
        setError(data.reasoning ?? "Fant ingen forslag");
      }
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setStep(1);
    setDraft(null);
    setInput("");
    setImages([]);
  }

  return (
    <div className="w-full max-w-3xl mt-12">
      <StepIndicator step={step} />
      {step === 1 && !loading && (
        <div className="w-full max-w-2xl mx-auto text-center fade-in-up">
          <h2
            className="text-lg font-medium mb-1"
            style={{ color: "#3A2E22" }}
          >
            Hva vil du selge?
          </h2>
          <p className="text-sm mb-4" style={{ color: "#8A7A68" }}>
            Skriv modell, tilstand, lagring og batterihelse, så fyller vi ut
            resten.
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              placeholder="iPhone 13 Pro, 256 GB, pent brukt, batterihelse 88 prosent"
              style={{ border: "1px solid #E9DCCB", background: "white" }}
              className="w-full rounded-2xl px-6 py-4 text-sm outline-none mb-4 resize-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0]"
            />

            <ImageUploader images={images} onImagesChange={setImages} />

            <div className="flex gap-2 justify-center">
              <button
                type="submit"
                disabled={input.trim().length < MIN_DESCRIPTION_LENGTH}
                className="px-4 py-1.5 rounded-full text-sm border border-[#C4622E] text-[#C4622E] bg-transparent transition-colors hover:bg-[#C4622E] hover:text-[#FBF7F0] focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#C4622E]"
              >
                Lag annonseutkast
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <DraftSkeleton />}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {step === 2 && draft && (
        <EditDraftStep
          draft={draft}
          onDraftChange={setDraft}
          onContinue={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && draft && (
        <div className="max-w-xl mx-auto mt-8 fade-in-up">
          <div
            style={{
              background: "white",
              border: "1px solid #E9DCCB",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <GenerateDescription
              draft={draft}
              onDraftChange={setDraft}
              images={images}
              onPublish={resetFlow}
              onBack={() => setStep(2)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
