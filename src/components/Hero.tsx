"use client";

import { useState } from "react";
import ListingCard from "./ListingCard";

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
          setPriceSuggestion({ ...data.priceRange, reasoning: data.reasoning });
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
              Se forslag
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

        {priceSuggestion && (
          <div className="text-center mb-8">
            <p className="text-2xl" style={{ color: "#C4622E" }}>
              {priceSuggestion.low}–{priceSuggestion.high}kr
            </p>
            <p style={{ color: "#8A7A68" }} className="text-sm mt-2">
              {priceSuggestion.reasoning}
            </p>
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
