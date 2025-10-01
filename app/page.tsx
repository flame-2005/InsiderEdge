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
      {/* Header Section */}
      <div className="border-b border-gray-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Market Activity
                </h1>
                <p className="text-xs text-gray-500 font-medium">Real-time exchange updates</p>
              </div>
            </div>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-emerald-700">Active</span>
                </div>
                <button
                  onClick={signOut}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
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

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-lg border-2 border-gray-200/50">
            <button
              onClick={() => setCurrentTab(Tabs.Current)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentTab === Tabs.Current 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Insider Trading</span>
            </button>
            <button
              onClick={() => setCurrentTab(Tabs.BulkDeal)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentTab === Tabs.BulkDeal 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Bulk Deals</span>
            </button>
            <button
              onClick={() => setCurrentTab(Tabs.Actions)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentTab === Tabs.Actions 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Corporate Actions</span>
            </button>
          </div>
        </div>

        {/* Exchange Toggle - Only show for Current tab */}
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

        {/* Activity Cards with Animation */}
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