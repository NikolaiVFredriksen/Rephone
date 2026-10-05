"use client";

import { useState } from "react";
import BuySellToggle from "./shared/BuySellToggle";
import Hero from "./shared/Hero";
import BuyFlow from "./buy/BuyFlow";
import SellFlow from "./sell/SellFlow";

type Mode = "kjop" | "selg";

export default function HomeContent() {
  const [mode, setMode] = useState<Mode>("kjop");

  return (
    <main className="px-6 py-12 flex-1 flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full flex flex-col items-center -translate-y-10">
        {mode === "kjop" && <Hero />}
        <div
          className={`w-full flex flex-col items-center gap-3 ${mode === "kjop" ? "mt-10" : ""}`}
        >
          <BuySellToggle mode={mode} onChange={setMode} />
          <div className="w-full flex flex-col items-center">
            {mode === "kjop" ? <BuyFlow /> : <SellFlow />}
          </div>
        </div>
      </div>
    </main>
  );
}
