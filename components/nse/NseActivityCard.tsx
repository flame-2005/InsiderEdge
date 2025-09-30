"use client"

import React, { useState, useMemo } from "react";
import { useNseTrades } from "@/context/NseTradeContext";
import { TradeCard } from "../tradeCard/TradeCard";
import { NseInsiderTrade, NseTransformedTrade } from "@/constants/company";

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

  const uniqueRegulations = useMemo(() => {
    if (!trades) return [];
    const regulations = new Set(trades.map(t => t.regulation).filter(Boolean));
    return Array.from(regulations).sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (!trades) return [];

    return trades
      .sort((a, b) => {
        return new Date(b.disclosedAt).getTime() - new Date(a.disclosedAt).getTime();
      })
      .filter(trade => {

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
      })
      .map(transformNseToBseFormat);
  }, [trades, searchCompany, transactionFilter, regulationFilter, minQuantity]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500 py-12">
          No insider trading activity in the last 24 hours
        </div>
      </div>
    );
  }

  const clearFilters = () => {
    setSearchCompany("");
    setTransactionFilter("all");
    setRegulationFilter("all");
    setMinQuantity("");
  };

  const hasActiveFilters = searchCompany || transactionFilter !== "all" || regulationFilter !== "all" || minQuantity;

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">NSE Insider Trading Activity (24h)</h2>
        <span className="text-sm text-gray-600">
          {filteredTrades.length} of {trades.length} transactions
        </span>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Company Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Company
            </label>
            <input
              type="text"
              placeholder="Company name or symbol..."
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value as "all" | "buy" | "sell")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Transactions</option>
              <option value="buy">Buy Only</option>
              <option value="sell">Sell Only</option>
            </select>
          </div>

          {/* Regulation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regulation
            </label>
            <select
              value={regulationFilter}
              onChange={(e) => setRegulationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min. Shares
            </label>
            <input
              type="number"
              placeholder="e.g., 10000"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchCompany && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Company: {searchCompany}
              </span>
            )}
            {transactionFilter !== "all" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {transactionFilter === "buy" ? "Buys" : "Sells"}
              </span>
            )}
            {regulationFilter !== "all" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {regulationFilter}
              </span>
            )}
            {minQuantity && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Min: {Number(minQuantity).toLocaleString()} shares
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filteredTrades.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl">
          No transactions match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrades.map((trade) => (
            <TradeCard key={trade._id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
