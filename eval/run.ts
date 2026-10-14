import { readFileSync } from "node:fs";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

function parseArgs() {
  const args = process.argv.slice(2);
  let file = "eval/cases.json";
  let runs = 1;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--runs") runs = Number(args[++i]) || 1;
    else if (args[i] === "--file") file = args[++i];
    else if (!args[i].startsWith("--")) file = args[i];
  }
  return { file, runs };
}

const { file, runs } = parseArgs();

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

const cases: Case[] = JSON.parse(readFileSync(file, "utf-8"));

function same(got: unknown, want: unknown) {
  if (typeof got === "string" && typeof want === "string") {
    return got.toLowerCase() === want.toLowerCase();
  }
  if (Array.isArray(got) && Array.isArray(want)) {
    const a = [...got].map((x) => String(x).toLowerCase()).sort();
    const b = [...want].map((x) => String(x).toLowerCase()).sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
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

async function runCase(c: Case) {
  const res = await fetch(`${BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: c.input }),
  });

  if (!res.ok) {
    return { ok: false, problems: [`serveren svarte ${res.status}`], filters: {}, results: [] as Listing[] };
  }

  const data = await res.json();
  const filters = data.filters ?? {};
  const results: Listing[] = data.results ?? [];
  const problems: string[] = [];

  for (const [key, want] of Object.entries(c.expected)) {
    const got = filters[key] ?? null;
    if (!same(got, want)) {
      problems.push(`tolkning ${key}: forventet ${JSON.stringify(want)}, fikk ${JSON.stringify(got)}`);
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

  return { ok: problems.length === 0, problems, filters, results };
}

async function main() {
  console.log(`Fil: ${file}, kjøringer: ${runs}`);
  const filtersPerCase: Record<string, string[]> = {};
  let lastRunOk = 0;

  for (let r = 0; r < runs; r++) {
    let casesOk = 0;
    if (runs > 1) console.log(`\n--- Kjøring ${r + 1}/${runs} ---`);

    for (const c of cases) {
      const { ok, problems, filters, results } = await runCase(c);
      filtersPerCase[c.id] = filtersPerCase[c.id] ?? [];
      filtersPerCase[c.id].push(JSON.stringify(filters));

      console.log(
        `\n${ok ? "OK  " : "FEIL"} ${c.id}: ${c.input} (${results.length} treff)`,
      );
      problems.forEach((p) => console.log(`     ${p}`));
      if (ok) casesOk++;
    }

    console.log(`\nSaker riktige: ${casesOk}/${cases.length}`);
    lastRunOk = casesOk;
  }

  if (runs > 1) {
    const unstable = Object.entries(filtersPerCase).filter(
      ([, arr]) => new Set(arr).size > 1,
    );
    console.log(
      `\nStabilitet: ${unstable.length}/${cases.length} saker ga ulikt svar mellom de ${runs} kjøringene.`,
    );
    unstable.forEach(([id]) => console.log(`     ustabil: ${id}`));
  }

  console.log(`\nSiste kjøring - saker riktige: ${lastRunOk}/${cases.length}`);
}

main().catch((e) => {
  console.error("Skriptet krasjet. Går dev-serveren?", e.message);
});
