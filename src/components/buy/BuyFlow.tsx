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
      setResults(data.slice(0, 6));
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="max-w-xl mx-auto text-center">
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="...hva trenger du?"
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
            <button
              type="button"
              onClick={handleShowRecommendations}
              style={{ border: "1px dashed #C9A98D", color: "#8A7A68" }}
              className="px-4 py-1.5 rounded-full text-sm"
            >
              Våre anbefalinger
            </button>
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

        <FilterChips filters={filters} />
        <ResultsGrid results={results} />
      </div>
    </>
  );
}
