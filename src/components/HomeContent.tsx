"use client";

import { useCallback, useState } from "react";
import BuySellToggle from "./shared/BuySellToggle";
import Hero from "./shared/Hero";
import Footer from "./shared/Footer";
import BuyFlow from "./buy/BuyFlow";
import SellFlow from "./sell/SellFlow";
import SellGate from "./sell/SellGate";

type Mode = "kjop" | "selg";

export default function HomeContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mode, setMode] = useState<Mode>("kjop");
  const [hasResults, setHasResults] = useState(false);
  const handleResults = useCallback(
    (count: number) => setHasResults(count > 0),
    [],
  );
  const showFooter = mode === "kjop" && hasResults;

  return (
    <>
      <main
        className={`px-6 flex-1 flex flex-col items-center overflow-hidden ${
          showFooter ? "pt-8 pb-16 justify-start" : "py-12 justify-center"
        }`}
      >
        <div
          className={`home-shell w-full flex flex-col items-center ${
            showFooter ? "" : "-translate-y-10"
          }`}
        >
          {mode === "kjop" && <Hero />}
          <div
            className={`w-full flex flex-col items-center gap-3 ${mode === "kjop" ? "mt-10" : ""}`}
          >
            <BuySellToggle mode={mode} onChange={setMode} />
            <div className="w-full flex flex-col items-center">
              {mode === "kjop" ? (
                <BuyFlow onResultsChange={handleResults} />
              ) : isLoggedIn ? (
                <SellFlow />
              ) : (
                <SellGate />
              )}
            </div>
          </div>
        </div>
      </main>
      {showFooter && <Footer />}
    </>
  );
}
