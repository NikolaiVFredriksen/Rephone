"use client";

import { useState } from "react";
import Spinner from "../shared/Spinner";

type ImageUploaderProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
};

export default function ImageUploader({
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Opplasting feilet");
      }

      onImagesChange([...images, data.url].slice(0, 3));
    } catch {
      setError("Kunne ikke laste opp bildet, prøv igjen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-2 mb-4">
      <div className="flex justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <label
            key={i}
            style={{
              width: 72,
              height: 72,
              background: "white",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#C9A98D",
              fontSize: 24,
              overflow: "hidden",
            }}
            className="border border-dashed border-[#C9A98D] transition-colors hover:border-[#C4622E] hover:text-[#C4622E] focus-within:ring-2 focus-within:ring-[#C4622E] focus-within:ring-offset-2 focus-within:ring-offset-[#FBF7F0]"
          >
            {images[i] ? (
              <img
                src={images[i]}
                className="fade-in-up"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : uploading ? (
              <Spinner size={16} />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 2v14M2 9h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
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
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
