import { readFileSync } from "node:fs";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

type Case = {
  id: string;
  input: string;
  expected: Record<string, string | number | null>;
};

const cases: Case[] = JSON.parse(readFileSync("eval/cases.json", "utf-8"));

function same(got: unknown, want: unknown) {
  if (typeof got === "string" && typeof want === "string") {
    return got.toLowerCase() === want.toLowerCase();
  }
  return got === want;
}

async function main() {
  let fieldsOk = 0;
  let fieldsTotal = 0;
  let casesOk = 0;

  for (const c of cases) {
    const res = await fetch(`${BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: c.input }),
    });
    const data = await res.json();
    const filters = data.filters ?? {};

    console.log(`\n${c.id}: ${c.input}`);
    let allOk = true;

    for (const [key, want] of Object.entries(c.expected)) {
      const got = filters[key] ?? null;
      const pass = same(got, want);
      fieldsTotal++;
      if (pass) fieldsOk++;
      else allOk = false;
      console.log(
        `  ${pass ? "OK  " : "FEIL"} ${key}: forventet ${want}, fikk ${got}`,
      );
    }

    if (allOk) casesOk++;
  }

  console.log(`\nSaker helt riktige: ${casesOk}/${cases.length}`);
  console.log(`Felt riktige: ${fieldsOk}/${fieldsTotal}`);
}

main();
