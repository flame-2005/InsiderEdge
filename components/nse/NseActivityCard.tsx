"use client"

import React, { useState, useMemo } from "react";
import { useNseTrades } from "@/context/NseTradeContext";
import { TradeCard } from "../tradeCard/TradeCard";
import { NseInsiderTrade, NseTransformedTrade } from "@/constants/company";
import { Search, TrendingUp, TrendingDown, Filter, X, BarChart3, Users, Building2, Calendar } from "lucide-react";

const transformNseToBseFormat = (nseTrade: NseInsiderTrade): NseTransformedTrade => ({
  _id: nseTrade._id,
  _creationTime: nseTrade._creationTime,
  scripCode: nseTrade.symbol,
  companyName: nseTrade.companyName,
  personName: nseTrade.acquirerOrDisposer,
  category: nseTrade.regulation,
  securitiesHeldPreTransaction: null,
  securitiesHeldPrePercentage: null,
  securityType: nseTrade.securityType,
  numberOfSecurities: nseTrade.quantity,
  valuePerSecurity: null,
  transactionType: nseTrade.transactionType,
  securitiesHeldPostTransaction: null,
  securitiesHeldPostPercentage: null,
  dateOfAllotmentOrTransaction: nseTrade.disclosedAt,
  dateOfAllotmentOrTransactionText: new Date(nseTrade.disclosedAt).toLocaleDateString('en-GB'),
  modeOfAcquisition: null,
  derivativeType: null,
  buyValueUnits: null,
  sellValueUnits: null,
  dateOfIntimation: nseTrade.disclosedAt,
  dateOfIntimationText: new Date(nseTrade.disclosedAt).toLocaleDateString('en-GB'),
  createdAt: nseTrade._creationTime,
  xbrlLink: nseTrade.xbrlLink,
});

export default function NseActivityCards() {
  const { trades, isLoading } = useNseTrades();
  const [searchCompany, setSearchCompany] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<"all" | "buy" | "sell">("all");
  const [regulationFilter, setRegulationFilter] = useState<string>("all");
  const [minQuantity, setMinQuantity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "quantity">("date");

  const uniqueRegulations = useMemo(() => {
    if (!trades) return [];
    const regulations = new Set(trades.map(t => t.regulation).filter(Boolean));
    return Array.from(regulations).sort();
  }, [trades]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!trades) return { totalTrades: 0, buyCount: 0, sellCount: 0, totalVolume: 0 };
    
    const buyCount = trades.filter(t => 
      t.transactionType?.toLowerCase().includes("acquisition") || 
      t.transactionType?.toLowerCase().includes("buy") ||
      t.transactionType?.toLowerCase().includes("purchase")
    ).length;
    
    const sellCount = trades.length - buyCount;
    const totalVolume = trades.reduce((sum, t) => sum + (t.quantity || 0), 0);
    
    return {
      totalTrades: trades.length,
      buyCount,
      sellCount,
      totalVolume
    };
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (!trades) return [];

    const filtered = trades.filter(trade => {
      const matchesCompany = !searchCompany || 
        trade.companyName?.toLowerCase().includes(searchCompany.toLowerCase()) ||
        trade.symbol?.toLowerCase().includes(searchCompany.toLowerCase());

      const isBuy = trade.transactionType?.toLowerCase().includes("acquisition") || 
                   trade.transactionType?.toLowerCase().includes("buy") ||
                   trade.transactionType?.toLowerCase().includes("purchase");
      const matchesTransaction = 
        transactionFilter === "all" ||
        (transactionFilter === "buy" && isBuy) ||
        (transactionFilter === "sell" && !isBuy);

      const matchesRegulation = regulationFilter === "all" || trade.regulation === regulationFilter;

      const matchesQuantity = !minQuantity || 
        (trade.quantity && trade.quantity >= Number(minQuantity));

      return matchesCompany && matchesTransaction && matchesRegulation && matchesQuantity;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.disclosedAt).getTime() - new Date(a.disclosedAt).getTime();
      } else {
        return (b.quantity || 0) - (a.quantity || 0);
      }
    });

    return filtered.map(transformNseToBseFormat);
  }, [trades, searchCompany, transactionFilter, regulationFilter, minQuantity, sortBy]);

  const clearFilters = () => {
    setSearchCompany("");
    setTransactionFilter("all");
    setRegulationFilter("all");
    setMinQuantity("");
  };

  const hasActiveFilters = searchCompany || transactionFilter !== "all" || regulationFilter !== "all" || minQuantity;

  const formatVolume = (num: number): string => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Activity Found</h2>
            <p className="text-gray-600">No NSE insider trading activity in the last 24 hours</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              NSE Insider Trading Dashboard
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Last 24 hours activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showFilters 
                  ? "bg-purple-600 text-white shadow-lg" 
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[searchCompany, transactionFilter !== "all", regulationFilter !== "all", minQuantity].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalTrades}</p>
            <p className="text-sm text-gray-600 mt-1">Transactions</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Buys</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900">{statistics.buyCount}</p>
            <p className="text-sm text-emerald-700 mt-1">
              {statistics.totalTrades > 0 ? ((statistics.buyCount / statistics.totalTrades) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-100 rounded-2xl p-6 border-2 border-rose-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-rose-600" />
              <span className="text-sm font-medium text-rose-700">Sells</span>
            </div>
            <p className="text-3xl font-bold text-rose-900">{statistics.sellCount}</p>
            <p className="text-sm text-rose-700 mt-1">
              {statistics.totalTrades > 0 ? ((statistics.sellCount / statistics.totalTrades) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Volume</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {formatVolume(statistics.totalVolume)}
            </p>
            <p className="text-sm text-purple-700 mt-1">Total shares traded</p>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Sort
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Company Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Company
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name or symbol..."
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value as "all" | "buy" | "sell")}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="all">All Transactions</option>
                  <option value="buy">📈 Buy Only</option>
                  <option value="sell">📉 Sell Only</option>
                </select>
              </div>

              {/* Regulation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Regulation
                </label>
                <select
                  value={regulationFilter}
                  onChange={(e) => setRegulationFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="all">All Regulations</option>
                  {uniqueRegulations.map(regulation => (
                    <option key={regulation} value={regulation}>
                      {regulation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min. Shares
                </label>
                <input
                  type="number"
                  placeholder="e.g., 10000"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "quantity")}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="date">📅 Date (Newest)</option>
                  <option value="quantity">📊 Quantity (Highest)</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-100">
                <span className="text-sm font-medium text-gray-600">Active:</span>
                {searchCompany && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <Search className="w-3 h-3" />
                    {searchCompany}
                    <button onClick={() => setSearchCompany("")} className="hover:bg-purple-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {transactionFilter !== "all" && (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                    {transactionFilter === "buy" ? "📈 Buys" : "📉 Sells"}
                    <button onClick={() => setTransactionFilter("all")} className="hover:bg-emerald-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {regulationFilter !== "all" && (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                    {regulationFilter}
                    <button onClick={() => setRegulationFilter("all")} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minQuantity && (
                  <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                    Min: {Number(minQuantity).toLocaleString()}
                    <button onClick={() => setMinQuantity("")} className="hover:bg-orange-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            {filteredTrades.length === trades.length ? "All Transactions" : "Filtered Results"}
          </h2>
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            {filteredTrades.length} of {trades.length}
          </span>
        </div>

        {/* Results */}
        {filteredTrades.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrades.map((trade) => (
              <TradeCard key={trade._id} trade={trade} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}