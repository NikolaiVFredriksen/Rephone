"use client";

import { useState } from "react";

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
                src={images[i]}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : uploading ? (
              "..."
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
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
