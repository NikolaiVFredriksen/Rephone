"use client";

import { useEffect, useState } from "react";
import FilterChips from "./FilterChips";
import ResultsGrid from "../shared/ResultsGrid";
import ResultsGridSkeleton from "../shared/ResultsGridSkeleton";
import type { Listing } from "../shared/ListingCard";

type Filters = {
  budget?: number;
  minPrice?: number;
  brand?: string;
  model?: string;
  minBatteryHealth?: number;
  minStorage?: number;
  conditions?: string[];
  sortBy?: string;
  priorities?: string[];
  unsupported?: string[];
};

export default function BuyFlow({
  onResultsChange,
}: {
  onResultsChange?: (count: number) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [lastQuery, setLastQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  // Gir HomeContent beskjed om det finnes resultater, så footeren kan vises der.
  useEffect(() => {
    onResultsChange?.(results.length);
  }, [results.length, onResultsChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setError("");
    setResults([]);
    setFilters(null);
    setSearched(false);
    setTotal(0);
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
      setTotal(data.total ?? data.results.length);
      setLastQuery(input);
      setSearched(true);
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoading(false);
    }
  }

  async function handleShowMore() {
    setError("");
    setLoadingMore(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: lastQuery,
          filters,
          offset: results.length,
        }),
      });
      const data = await res.json();
      setResults((prev) => [...prev, ...data.results]);
      setTotal(data.total ?? total);
    } catch {
      setError("Noe gikk galt, prøv igjen");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleShowRecommendations() {
    setError("");
    setFilters(null);
    setSearched(false);
    setTotal(0);
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
          <div
            role="status"
            aria-live="polite"
            className="text-center text-sm mb-6"
          >
            <span aria-hidden="true" style={{ color: "#8A7A68" }}>
              Henter...
            </span>
            <span className="sr-only">Søker...</span>
          </div>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <FilterChips filters={filters} />
        {!loading && searched && results.length === 0 && (
          <p className="text-center text-sm mb-6" style={{ color: "#8A7A68" }}>
            Ingen treff. Prøv å fjerne et krav.
          </p>
        )}
        {!loading && searched && results.length > 0 && (
          <p className="text-center text-sm mb-6" style={{ color: "#8A7A68" }}>
            Viser {results.length} av {total}
          </p>
        )}
        {loading ? <ResultsGridSkeleton /> : <ResultsGrid results={results} />}
        {!loading && searched && results.length < total && (
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={handleShowMore}
              disabled={loadingMore}
              className="px-4 py-1.5 rounded-full text-sm border border-[#C4622E] text-[#C4622E] bg-transparent transition-colors hover:bg-[#C4622E] hover:text-[#FBF7F0] focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] outline-none disabled:opacity-50"
            >
              {loadingMore
                ? "Henter..."
                : `Vis ${Math.min(10, total - results.length)} flere`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
