"use client";

import { useState } from "react";
import BuySellToggle from "./shared/BuySellToggle";
import BuyFlow from "./buy/BuyFlow";
import SellFlow from "./sell/SellFlow";

type Mode = "kjop" | "selg";

export default function HomeContent() {
  const [mode, setMode] = useState<Mode>("kjop");

  return (
    <main className="px-6 py-8">
      <BuySellToggle mode={mode} onChange={setMode} />

      {mode === "kjop" ? <BuyFlow /> : <SellFlow />}
    </main>
  );
}
