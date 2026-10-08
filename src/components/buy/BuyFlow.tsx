"use client";

import { useState } from "react";
import FilterChips from "./FilterChips";
import ResultsGrid from "../shared/ResultsGrid";
import type { Listing } from "../shared/ListingCard";

type Filters = {
  budget?: number;
  brand?: string;
  priorities?: string[];
};

export default function BuyFlow() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [results, setResults] = useState<Listing[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setError("");
    setResults([]);
    setFilters(null);
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      setFilters(data.filters);
      setResults(data.results);
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  async function handleShowRecommendations() {
    setError("");
    setFilters(null);
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-2xl text-center">
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hva leter du etter?"
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="w-full rounded-full px-6 py-4 text-sm outline-none mb-4 transition-shadow focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0]"
          />

          <div className="flex gap-2 justify-center">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full text-sm border border-[#C4622E] text-[#C4622E] bg-transparent transition-colors hover:bg-[#C4622E] hover:text-[#FBF7F0] focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] outline-none"
            >
              Se forslag
            </button>
            <button
              type="button"
              onClick={handleShowRecommendations}
              className="px-4 py-1.5 rounded-full text-sm border border-dashed border-[#C9A98D] text-[#8A7A68] transition-colors hover:border-[#C4622E] hover:text-[#C4622E] focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] outline-none"
            >
              Våre anbefalinger
            </button>
          </div>
        </form>
      </div>

      <div className="w-full max-w-3xl mt-12">
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

        <FilterChips filters={filters} />
        <ResultsGrid results={results} />
      </div>
    </>
  );
}
