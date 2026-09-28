"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONDITIONS = [
  { value: "NY", label: "Ny" },
  { value: "PENT_BRUKT", label: "Pent brukt" },
  { value: "BRUKT", label: "Brukt" },
  { value: "GODT_BRUKT", label: "Godt brukt" },
];

export default function OpprettPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    brand: "",
    model: "",
    condition: "",
    price: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Noe gikk galt");
      return;
    }

    const listing = await res.json();
    router.push(`/annonse/${listing.id}`);
  }

  return (
    <main
      style={{ background: "#FBF7F0", minHeight: "100vh" }}
      className="px-6 py-10"
    >
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-medium mb-6" style={{ color: "#3A2E22" }}>
          Legg ut annonse
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Tittel"
            required
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="rounded-lg px-4 py-2.5 text-sm outline-none"
          />
          <input
            value={form.brand}
            onChange={(e) => updateField("brand", e.target.value)}
            placeholder="Merke (f.eks Apple, Samsung)"
            required
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="rounded-lg px-4 py-2.5 text-sm outline-none"
          />
          <input
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
            placeholder="Modell (f.eks iPhone 13)"
            required
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="rounded-lg px-4 py-2.5 text-sm outline-none"
          />
          <select
            value={form.condition}
            onChange={(e) => updateField("condition", e.target.value)}
            required
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="rounded-lg px-4 py-2.5 text-sm outline-none"
          >
            <option value="" disabled>
              Velg tilstand
            </option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            placeholder="Pris (kr)"
            type="number"
            required
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="rounded-lg px-4 py-2.5 text-sm outline-none"
          />
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Beskrivelse"
            required
            rows={4}
            style={{ border: "1px solid #E9DCCB", background: "white" }}
            className="rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "#C4622E", color: "#FBF7F0" }}
            className="rounded-full px-5 py-2.5 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? "Legger ut..." : "Legg ut annonse"}
          </button>
        </form>
      </div>
    </main>
  );
}
