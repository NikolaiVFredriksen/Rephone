"use client";

import { useState } from "react";
import ListingCard from "./ListingCard";
import GenerateDescription from "@/components/GenerateDescription";

type Mode = "kjop" | "selg";

type SearchResult = {
  id: string;
  title: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  reason?: string;
};

type Filters = {
  budget?: number;
  brand?: string;
  priorities?: string[];
};

export default function Hero() {
  const [mode, setMode] = useState<Mode>("kjop");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    low: number;
    high: number;
    reasoning: string;
  } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [draft, setDraft] = useState<{
    brand: string;
    model: string;
    condition: string;
    price: number;
    description: string;
    reasoning: string;
  } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setError("");
    setResults([]);
    setFilters(null);
    setPriceSuggestion(null);
    setLoading(true);

    try {
      if (mode === "kjop") {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        });
        const data = await res.json();
        setFilters(data.filters);
        setResults(data.results);
      } else {
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
          });
          setStep(2);
        } else {
          setError(data.reasoning ?? "Fant ingen forslag");
        }
      }
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  async function handleShowRecommendations() {
    setError("");
    setFilters(null);
    setPriceSuggestion(null);
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setResults(data.slice(0, 6));
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 3));
  }

  return (
    <main
      style={{ background: "#FBF7F0", minHeight: "100vh" }}
      className="px-6 py-8"
    >
      <div className="flex justify-between items-center max-w-3xl mx-auto mb-10">
        <span style={{ color: "#3A2E22" }} className="text-lg font-medium">
          Rephone
        </span>
        <a href="/logg-inn" style={{ color: "#8A7A68" }} className="text-sm">
          Logg inn
        </a>
      </div>

      <div className="max-w-xl mx-auto text-center">
        <div className="flex gap-2 justify-center mb-4">
          <button
            type="button"
            onClick={() => setMode("kjop")}
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
            onClick={() => setMode("selg")}
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

        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "kjop"
                ? "...hva trenger du?"
                : "...beskriv telefonen din"
            }
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="w-full rounded-full px-6 py-3 text-sm outline-none mb-4"
          />

          <div className="flex gap-2 justify-center">
            <button
              type="submit"
              style={{ border: "1px solid #C4622E", color: "#C4622E" }}
              className="px-4 py-1.5 rounded-full text-sm"
            >
              {mode === "kjop" ? "Se forslag" : "Se forslag til annonse"}
            </button>
            {mode === "kjop" && (
              <button
                type="button"
                onClick={handleShowRecommendations}
                style={{ border: "1px dashed #C9A98D", color: "#8A7A68" }}
                className="px-4 py-1.5 rounded-full text-sm"
              >
                Våre anbefalinger
              </button>
            )}
          </div>
          {mode === "selg" && (
            <div className="flex justify-center gap-3 mt-2 mb-4">
              {[0, 1, 2].map((i) => (
                <label
                  key={i}
                  style={{
                    width: 72,
                    height: 72,
                    background: "white",
                    border: "1px dashed #C9A98D",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#C9A98D",
                    fontSize: 24,
                    overflow: "hidden",
                  }}
                >
                  {images[i] ? (
                    <img
                      src={URL.createObjectURL(images[i])}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "+"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="max-w-3xl mx-auto mt-12">
        {loading && (
          <p style={{ color: "#8A7A68" }} className="text-center text-sm">
            Henter...
          </p>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {filters && (
          <div className="flex gap-2 justify-center flex-wrap mb-6">
            {filters.budget && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#F3DCD1", color: "#8A4A2E" }}
              >
                Budsjett: {filters.budget}kr
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
        )}

        {mode === "selg" && step === 2 && draft && (
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
                        setDraft((prev) =>
                          prev ? { ...prev, [key]: e.target.value } : null,
                        )
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
                <p
                  className="text-lg font-medium mt-1"
                  style={{ color: "#C4622E" }}
                >
                  {draft.price.toLocaleString("no")} kr
                </p>
              </div>
              <button
                onClick={() => setStep(3)}
                style={{ background: "#C4622E", color: "#FBF7F0" }}
                className="w-full rounded-full py-2.5 text-sm"
              >
                Fortsett
              </button>
            </div>
          </div>
        )}

        {mode === "selg" && step === 3 && draft && (
          <div className="max-w-xl mx-auto mt-8">
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
                onPublish={() => {
                  setStep(1);
                  setDraft(null);
                  setInput("");
                  setImages([]);
                }}
              />
            </div>
          </div>
        )}

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {results.map((r) => (
            <ListingCard key={r.id} listing={r} />
          ))}
        </div>
      </div>
    </main>
  );
}
