"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import EditDraftStep from "./EditDraftStep";
import GenerateDescription from "./GenerateDescription";
import StepIndicator from "./StepIndicator";

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

export default function SellFlow() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

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
      {step === 1 && (
        <div className="w-full max-w-2xl mx-auto text-center fade-in-up">
          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hva vil du selge?"
              style={{ border: "1px solid #E9DCCB", background: "white" }}
              className="w-full rounded-full px-6 py-4 text-sm outline-none mb-4 transition-shadow focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0]"
            />

            <ImageUploader images={images} onImagesChange={setImages} />

            <div className="flex gap-2 justify-center">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full text-sm border border-[#C4622E] text-[#C4622E] bg-transparent transition-colors hover:bg-[#C4622E] hover:text-[#FBF7F0] focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] outline-none"
              >
                Se forslag til annonse
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <p
          style={{ color: "#8A7A68" }}
          className="text-center text-sm"
          role="status"
          aria-live="polite"
        >
          Henter...
        </p>
      )}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {step === 2 && draft && (
        <EditDraftStep
          draft={draft}
          onDraftChange={setDraft}
          onContinue={() => setStep(3)}
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
              images={images}
              onPublish={resetFlow}
            />
          </div>
        </div>
      )}
    </div>
  );
}
