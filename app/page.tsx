"use client";

import BseActivityCards from "@/components/bse/BseActivityCard";
import NseActivityCards from "@/components/nse/NseActivityCard";
import TestCronButton from "@/components/testbutton";
import { useState } from "react";
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import BseBulkDealsCard from "@/components/bse/BseBulkDeals";
import BseCorporateActionsCard from "@/components/bse/BseCorporateActions";
import { TrendingUp, LogOut, LogIn, Activity, Building2, FileText } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";

type Exchange = "NSE" | "BSE";

enum Tabs {
  BulkDeal = "bulkdeal",
  Current = "current",
  Actions = 'actions',
}

export default function Home() {
  const [activeExchange, setActiveExchange] = useState<Exchange>("BSE");
  const { user, signOut } = useUserContext();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.Current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Test Cron Button */}
        {/* <div className="flex justify-center">
          <TestCronButton />
        </div> */}

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-lg border-2 border-gray-200/50">
            <button
              onClick={() => setCurrentTab(Tabs.Current)}
              className={`md:px-6 md:py-3 px-2 py-1 rounded-xl md:font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentTab === Tabs.Current 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            > 
              <Activity className="w-4 h-4 hidden md:block" />
              <span>Insider Trading</span>
            </button>
            <button
              onClick={() => setCurrentTab(Tabs.BulkDeal)}
              className={`md:px-6 md:py-3 px-2 py-1 rounded-xl  md:font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentTab === Tabs.BulkDeal 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Building2 className="w-4 h-4 hidden md:block" />
              <span>Bulk Deals</span>
            </button>
            <button
              onClick={() => setCurrentTab(Tabs.Actions)}
              className={`md:px-6 md:py-3 px-2 py-1 rounded-xl md:font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentTab === Tabs.Actions 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4 hidden md:block " />
              <span>Corporate Actions</span>
            </button>
          </div>
        </div>
        {currentTab === Tabs.Current && (
          <div className="flex justify-center animate-fadeIn">
            <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-lg border-2 border-gray-200/50">
              <button
                onClick={() => setActiveExchange("NSE")}
                className={`px-10 py-3 rounded-xl font-bold transition-all duration-300 relative ${
                  activeExchange === "NSE"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {activeExchange === "NSE" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse opacity-50"></div>
                )}
                <span className="relative flex items-center space-x-2">
                  <span className="text-lg">NSE</span>
                  {activeExchange === "NSE" && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveExchange("BSE")}
                className={`px-10 py-3 rounded-xl font-bold transition-all duration-300 relative ${
                  activeExchange === "BSE"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {activeExchange === "BSE" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse opacity-50"></div>
                )}
                <span className="relative flex items-center space-x-2">
                  <span className="text-lg">BSE</span>
                  {activeExchange === "BSE" && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="animate-fadeIn">
          {currentTab === Tabs.Current && (
            activeExchange === "NSE" ? <NseActivityCards /> : <BseActivityCards />
          )}
          {currentTab === Tabs.BulkDeal && <BseBulkDealsCard />}
          {currentTab === Tabs.Actions && <BseCorporateActionsCard />}
        </div>
      </div>
    </div>
  );
}