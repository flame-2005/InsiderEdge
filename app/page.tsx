"use client";

import BseActivityCards from "@/components/bse/BseActivityCard";
import NseActivityCards from "@/components/nse/NseActivityCard";
import TestCronButton from "@/components/testbutton";
import { useState } from "react";
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import BseBulkDealsCard from "@/components/bse/BseBulkDeals";

type Exchange = "NSE" | "BSE";

// Cleaner enum (values can be anything, but keep them consistent)
enum Tabs {
  BulkDeal = "bulkdeal",
  Current = "current",
}

export default function Home() {
  const [activeExchange, setActiveExchange] = useState<Exchange>("BSE");
  const { user, signOut } = useUserContext();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.Current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Market Activity</h1>
                <p className="text-xs text-gray-500">Real-time exchange updates</p>
              </div>
            </div>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Active</span>
                </div>
                <button
                  onClick={signOut}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign in for updates</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Test Cron Button */}
        <div className="flex justify-center">
          <TestCronButton />
        </div>

        {/* Exchange Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-lg border border-gray-200/50">
            <button
              onClick={() => setActiveExchange("NSE")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                activeExchange === "NSE"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {activeExchange === "NSE" && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse opacity-50"></div>
              )}
              <span className="relative flex items-center space-x-2">
                <span>NSE</span>
                {activeExchange === "NSE" && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                activeExchange === "BSE"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {activeExchange === "BSE" && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse opacity-50"></div>
              )}
              <span className="relative flex items-center space-x-2">
                <span>BSE</span>
                {activeExchange === "BSE" && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Simple Tab Toggle (optional UI) */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow border border-gray-200/50">
            <button
              onClick={() => setCurrentTab(Tabs.Current)}
              className={`px-6 py-2 rounded-xl font-semibold ${
                currentTab === Tabs.Current ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setCurrentTab(Tabs.BulkDeal)}
              className={`px-6 py-2 rounded-xl font-semibold ${
                currentTab === Tabs.BulkDeal ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Bulk Deals
            </button>
          </div>
        </div>

        {/* Activity Cards with Animation */}
        {currentTab === Tabs.Current ? (
          <div className="animate-fadeIn">
            {activeExchange === "NSE" ? <NseActivityCards /> : <BseActivityCards />}
          </div>
        ) : (
          <BseBulkDealsCard />
        )}
      </div>
    </div>
  );
}
