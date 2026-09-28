"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  brand: string;
  model: string;
  condition: string;
  price: number;
  description: string;
  reasoning: string;
};

export default function GenerateDescription({
  draft,
  onPublish,
}: {
  draft: Draft;
  onPublish: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(draft.description);
  const [loading, setLoading] = useState(false);

  async function generateDescription() {
    setLoading(true);
    const res = await fetch("/api/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: draft.brand,
        model: draft.model,
        condition: draft.condition,
        price: draft.price,
      }),
    });
    const data = await res.json();
    setDescription(data.description ?? "");
    setLoading(false);
  }

  async function publish() {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${draft.brand} ${draft.model}`,
        brand: draft.brand,
        model: draft.model,
        condition: draft.condition,
        price: Number(draft.price),
        description,
      }),
    });
    const listing = await res.json();
    router.push(`/annonse/${listing.id}`);
  }

  return (
    <>
      <p className="text-xs mb-3" style={{ color: "#8A7A68" }}>
        Beskriv annonsen
      </p>
      <button
        onClick={generateDescription}
        disabled={loading}
        style={{
          border: "1px solid #C4622E",
          color: "#C4622E",
          background: "transparent",
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 11,
          marginBottom: 10,
        }}
      >
        {loading ? "Genererer..." : "✦ Generer beskrivelse"}
      </button>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Beskriv telefonen..."
        style={{
          border: "1px solid #E9DCCB",
          background: "#FBF7F0",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          width: "100%",
          color: "#3A2E22",
          resize: "none",
          marginBottom: 12,
        }}
      />
      <button
        onClick={publish}
        style={{ background: "#C4622E", color: "#FBF7F0" }}
        className="w-full rounded-full py-2.5 text-sm"
      >
        Publiser annonse
      </button>
    </>
  );
}
