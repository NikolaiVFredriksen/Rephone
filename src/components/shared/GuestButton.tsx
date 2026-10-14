"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guestLogin } from "@/app/actions/guest-login";

export default function GuestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const result = await guestLogin();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-full py-2.5 text-sm text-[#8A7A68] bg-transparent transition-colors hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60"
      >
        {loading ? "Logger inn..." : "Fortsett som gjest"}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
