"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistrerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Noe gikk galt");
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (signInRes?.error) {
      setError("Registrert, men innlogging feilet. Prøv å logge inn manuelt.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="px-6 py-16 flex-1 flex flex-col items-center justify-center">
      <div
        style={{
          background: "white",
          border: "1px solid #E9DCCB",
          borderRadius: 24,
        }}
        className="w-full max-w-sm p-8 fade-in-up"
      >
        <form onSubmit={handleSubmit}>
          <h1
            className="text-xl font-medium mb-6 text-center"
            style={{ color: "#3A2E22" }}
          >
            Registrer deg
          </h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn"
            required
            style={{ border: "1px solid #E9DCCB", background: "#FBF7F0" }}
            className="w-full rounded-full px-4 py-2.5 text-sm outline-none mb-3 transition-shadow focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-post"
            required
            style={{ border: "1px solid #E9DCCB", background: "#FBF7F0" }}
            className="w-full rounded-full px-4 py-2.5 text-sm outline-none mb-3 transition-shadow focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passord"
            required
            style={{ border: "1px solid #E9DCCB", background: "#FBF7F0" }}
            className="w-full rounded-full px-4 py-2.5 text-sm outline-none mb-3 transition-shadow focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
          {error && (
            <p
              className="text-sm text-red-600 mb-3 text-center"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full py-2.5 text-sm bg-[#C4622E] text-[#FBF7F0] transition-colors hover:bg-[#A8521F] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Registrer deg
          </button>
        </form>
      </div>
    </main>
  );
}
