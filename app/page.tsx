"use client"

import BseActivityCards from "@/components/bse/BseActivityCard";
import NseActivityCards from "@/components/nse/NseActivityCard";
import TestCronButton from "@/components/testbutton";
import { useState } from "react";

type Exchange = "NSE" | "BSE";

export default function Home() {
  const [activeExchange, setActiveExchange] = useState<Exchange>("BSE");

  return (
    <div className="space-y-6">
      <TestCronButton/>
      {/* Toggle Switch */}
      <div className="flex justify-center p-4">
        <div className="inline-flex rounded-lg border-2 border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => setActiveExchange("NSE")}
            className={`px-6 py-2 rounded-md font-medium transition-all ${activeExchange === "NSE"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            NSE
          </button>
          <button
            onClick={() => setActiveExchange("BSE")}
            className={`px-6 py-2 rounded-md font-medium transition-all ${activeExchange === "BSE"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            BSE
          </button>
        </div>
      </div>

      {/* Content */}
      {activeExchange === "NSE" ? <NseActivityCards /> : <BseActivityCards />}
    </div>
  )
}
