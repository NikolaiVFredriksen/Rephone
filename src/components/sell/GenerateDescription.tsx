"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "../shared/Spinner";
import Skeleton from "../shared/Skeleton";
import type { Draft } from "./types";

const CONDITION_LABELS: Record<string, string> = {
  NY: "Ny",
  PENT_BRUKT: "Pent brukt",
  BRUKT: "Brukt",
  GODT_BRUKT: "Godt brukt",
};

function storageLabel(gb: number) {
  return gb === 1024 ? "1TB" : `${gb}GB`;
}

export default function GenerateDescription({
  draft,
  onDraftChange,
  images,
  onPublish,
  onBack,
}: {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  images: string[];
  onPublish: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const description = draft.description;
  const [loading, setLoading] = useState(true);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  async function generateDescription() {
    setLoading(true);
    setGenerationFailed(false);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: draft.brand,
          model: draft.model,
          condition: draft.condition,
          price: draft.price,
          batteryHealth: draft.batteryHealth,
          storage: draft.storage,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      onDraftChange({ ...draft, description: data.description ?? "" });
    } catch (err) {
      console.error("Kunne ikke generere beskrivelse:", err);
      onDraftChange({ ...draft, description: "" });
      setGenerationFailed(true);
    } finally {
      setLoading(false);
    }
  }

  // Beskrivelsen genereres automatisk første gang brukeren kommer til steg 3.
  // Går brukeren tilbake til steg 2 og videre igjen, er draft.description
  // allerede fylt ut (lagret på selve draften), så den skal ikke overskrives.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!draft.description.trim()) {
      generateDescription();
    } else {
      setLoading(false);
    }
  }, []);

  async function publish() {
    setPublishing(true);
    setPublishError("");
    try {
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
          batteryHealth: draft.batteryHealth,
          storage: draft.storage,
          imageUrl: images[0] ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPublishError(
          data.error ?? "Kunne ikke publisere annonsen, prøv igjen",
        );
        return;
      }

      const listing = await res.json();
      onPublish();
      router.push(`/annonse/${listing.id}`);
    } catch (err) {
      console.error("Kunne ikke publisere annonsen:", err);
      setPublishError("Kunne ikke publisere annonsen, prøv igjen");
    } finally {
      setPublishing(false);
    }
  }

  const canPublish = description.trim().length > 0 && !publishing;

  return (
    <>
      <h2 className="text-lg font-medium mb-1" style={{ color: "#3A2E22" }}>
        Beskrivelse
      </h2>
      <p className="text-xs mb-3" style={{ color: "#8A7A68" }}>
        Vi har skrevet et forslag. Rediger fritt, eller generer på nytt.
      </p>

      <div
        className="flex items-center gap-3 mb-4 p-2.5 rounded-xl"
        style={{ background: "#FBF7F0", border: "1px solid #E9DCCB" }}
      >
        {images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0]}
            alt=""
            className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-lg flex-shrink-0"
            style={{ background: "#F3DCD1" }}
            aria-hidden="true"
          />
        )}
        <div className="text-xs min-w-0">
          <p className="font-medium truncate" style={{ color: "#3A2E22" }}>
            {draft.brand} {draft.model}
          </p>
          <p style={{ color: "#8A7A68" }}>
            {draft.storage ? `${storageLabel(draft.storage)} · ` : ""}
            {CONDITION_LABELS[draft.condition] ?? draft.condition} ·{" "}
            {draft.price.toLocaleString("no")} kr
          </p>
        </div>
      </div>

      <button
        onClick={generateDescription}
        disabled={loading}
        style={{
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 11,
          marginBottom: 10,
        }}
        className="border border-[#C4622E] text-[#C4622E] bg-transparent transition-colors hover:bg-[#C4622E] hover:text-[#FBF7F0] disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {loading ? "Genererer..." : "Generer på nytt"}
      </button>

      {loading ? (
        <div className="mb-3">
          <div
            className="flex items-center gap-2 text-xs mb-2"
            style={{ color: "#8A7A68" }}
          >
            <Spinner size={12} />
            <span>Skriver forslag...</span>
          </div>
          <Skeleton className="h-24 w-full block" />
        </div>
      ) : (
        <>
          {generationFailed && (
            <p className="text-xs mb-2" style={{ color: "#C4622E" }}>
              Kunne ikke lage forslag. Skriv selv.
            </p>
          )}
          <textarea
            value={description}
            onChange={(e) =>
              onDraftChange({ ...draft, description: e.target.value })
            }
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
            className="transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E]"
          />
        </>
      )}

      {publishError && (
        <p className="text-xs mb-2 text-center" style={{ color: "#C4622E" }}>
          {publishError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={publishing}
          className="rounded-full py-2.5 px-4 text-sm border border-[#E9DCCB] text-[#8A7A68] bg-transparent transition-colors hover:border-[#C4622E] hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Tilbake
        </button>
        <button
          onClick={publish}
          disabled={!canPublish}
          className="flex-1 rounded-full py-2.5 text-sm bg-[#C4622E] text-[#FBF7F0] transition-colors hover:bg-[#A8521F] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#C4622E]"
        >
          {publishing ? "Publiserer..." : "Publiser annonse"}
        </button>
      </div>
      {description.trim().length === 0 && !loading && (
        <p className="text-xs text-center mt-2" style={{ color: "#8A4A2E" }}>
          Skriv en beskrivelse før du kan publisere
        </p>
      )}
    </>
  );
}
