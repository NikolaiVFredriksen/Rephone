import { readFileSync } from "node:fs";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

type Case = {
  id: string;
  input: string;
  expected: Record<string, string | number | null>;
  onlyModelsContaining?: string[];
  onlyBrands?: string[];
  minResults?: number;
};

type Listing = {
  brand: string;
  model: string;
  price: number;
  batteryHealth: number | null;
  storage: number | null;
};

const cases: Case[] = JSON.parse(readFileSync("eval/cases.json", "utf-8"));

function same(got: unknown, want: unknown) {
  if (typeof got === "string" && typeof want === "string") {
    return got.toLowerCase() === want.toLowerCase();
  }
  return got === want;
}

function filterViolations(l: Listing, f: Record<string, unknown>): string[] {
  const v: string[] = [];
  if (f.budget && l.price > Number(f.budget)) {
    v.push(`pris ${l.price} over budsjett ${f.budget}`);
  }
  if (f.brand && l.brand.toLowerCase() !== String(f.brand).toLowerCase()) {
    v.push(`merke ${l.brand}, ønsket ${f.brand}`);
  }
  if (
    f.model &&
    !l.model.toLowerCase().includes(String(f.model).toLowerCase())
  ) {
    v.push(`modell ${l.model} inneholder ikke ${f.model}`);
  }
  if (
    f.minBatteryHealth &&
    (l.batteryHealth ?? 0) < Number(f.minBatteryHealth)
  ) {
    v.push(`batteri ${l.batteryHealth}, ønsket minst ${f.minBatteryHealth}`);
  }
  if (f.minStorage && (l.storage ?? 0) < Number(f.minStorage)) {
    v.push(`lagring ${l.storage}, ønsket minst ${f.minStorage}`);
  }
  return v;
}

async function main() {
  let casesOk = 0;

  for (const c of cases) {
    const res = await fetch(`${BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: c.input }),
    });

    if (!res.ok) {
      console.log(`\nFEIL ${c.id}: serveren svarte ${res.status}`);
      continue;
    }

    const data = await res.json();
    const filters = data.filters ?? {};
    const results: Listing[] = data.results ?? [];
    const problems: string[] = [];

    for (const [key, want] of Object.entries(c.expected)) {
      const got = filters[key] ?? null;
      if (!same(got, want)) {
        problems.push(`tolkning ${key}: forventet ${want}, fikk ${got}`);
      }
    }

    for (const l of results) {
      for (const v of filterViolations(l, filters)) {
        problems.push(`resultat ${l.model}: ${v}`);
      }
      if (
        c.onlyModelsContaining &&
        !c.onlyModelsContaining.some((m) =>
          l.model.toLowerCase().includes(m.toLowerCase()),
        )
      ) {
        problems.push(
          `resultat ${l.model}: ikke blant ${c.onlyModelsContaining.join(", ")}`,
        );
      }
      if (
        c.onlyBrands &&
        !c.onlyBrands.some((b) => b.toLowerCase() === l.brand.toLowerCase())
      ) {
        problems.push(
          `resultat ${l.brand} ${l.model}: ikke blant merker ${c.onlyBrands.join(", ")}`,
        );
      }
    }

    if (c.minResults !== undefined && results.length < c.minResults) {
      problems.push(
        `bare ${results.length} treff, forventet minst ${c.minResults}`,
      );
    }

    console.log(
      `\n${problems.length === 0 ? "OK  " : "FEIL"} ${c.id}: ${c.input} (${results.length} treff)`,
    );
    problems.forEach((p) => console.log(`     ${p}`));
    if (problems.length === 0) casesOk++;
  }

  console.log(`\nSaker riktige: ${casesOk}/${cases.length}`);
}

main().catch((e) => {
  console.error("Skriptet krasjet. Går dev-serveren?", e.message);
});
