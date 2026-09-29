"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoggInnPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Feil e-post eller passord");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="px-6 py-10">
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
        <h1
          className="text-xl font-medium mb-6 text-center"
          style={{ color: "#3A2E22" }}
        >
          Logg inn
        </h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-post"
          required
          style={{ border: "1px solid #E9DCCB", background: "white" }}
          className="w-full rounded-full px-4 py-2.5 text-sm outline-none mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passord"
          required
          style={{ border: "1px solid #E9DCCB", background: "white" }}
          className="w-full rounded-full px-4 py-2.5 text-sm outline-none mb-3"
        />
        {error && (
          <p className="text-sm text-red-600 mb-3 text-center">{error}</p>
        )}
        <button
          type="submit"
          style={{ background: "#C4622E", color: "#FBF7F0" }}
          className="w-full rounded-full py-2.5 text-sm mb-4 cursor-pointer"
        >
          Logg inn
        </button>
        <p className="text-sm text-center" style={{ color: "#8A7A68" }}>
          Ny her?{" "}
          <Link href="/registrer" style={{ color: "#C4622E" }}>
            Registrer deg
          </Link>
        </p>
      </form>
    </main>
  );
}
