"use client";

import { useState } from "react";
import BuySellToggle from "./shared/BuySellToggle";
import BuyFlow from "./buy/BuyFlow";
import SellFlow from "./sell/SellFlow";

type Mode = "kjop" | "selg";

export default function HomeContent() {
  const [mode, setMode] = useState<Mode>("kjop");

  return (
    <main
      style={{ background: "#FBF7F0", minHeight: "100vh" }}
      className="px-6 py-8"
    >
      <div className="flex justify-between items-center max-w-3xl mx-auto mb-10">
        <span style={{ color: "#3A2E22" }} className="text-lg font-medium">
          Rephone
        </span>
        <a href="/logg-inn" style={{ color: "#8A7A68" }} className="text-sm">
          Logg inn
        </a>
      </div>

      <BuySellToggle mode={mode} onChange={setMode} />

      {mode === "kjop" ? <BuyFlow /> : <SellFlow />}
    </main>
  );
}
