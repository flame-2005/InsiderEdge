"use client"

import React, { useState, useMemo } from "react";
import { useBseTrades } from "@/context/BseTradesContext";
import { TradeCard } from "../tradeCard/TradeCard";

export default function BseActivityCards() {
    const { trades, isLoading } = useBseTrades();
    
    // Filter states
    const [searchCompany, setSearchCompany] = useState("");
    const [transactionFilter, setTransactionFilter] = useState<"all" | "buy" | "sell">("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [minQuantity, setMinQuantity] = useState("");

    // Get unique categories for filter dropdown
    const uniqueCategories = useMemo(() => {
        if (!trades) return [];
        const categories = new Set(trades.map(t => t.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [trades]);

    // Filter trades based on all criteria
    const filteredTrades = useMemo(() => {
        if (!trades) return [];

        return trades
            .sort((a, b) => {
                // Parse dates from "22/09/2025 22/09/2025" format - take the first date
                const getDateValue = (dateStr: string | null) => {
                    if (!dateStr) return 0;
                    const firstDate = dateStr.trim().split(" ")[0];
                    if (!firstDate) return 0;
                    const [day, month, year] = firstDate.split("/");
                    if (!day || !month || !year) return 0;
                    return new Date(+year, +month - 1, +day).getTime();
                };
                
                const dateA = getDateValue(a.dateOfAllotmentOrTransactionText);
                const dateB = getDateValue(b.dateOfAllotmentOrTransactionText);
                
                return dateB - dateA; // Newest first
            })
            .filter(trade => {
            // Company name search
            const matchesCompany = !searchCompany || 
                trade.companyName?.toLowerCase().includes(searchCompany.toLowerCase()) ||
                trade.scripCode?.toLowerCase().includes(searchCompany.toLowerCase());

            // Transaction type filter (buy/sell)
            const isBuy = trade.transactionType?.toLowerCase().includes("acquisition") || 
                         trade.transactionType?.toLowerCase().includes("buy");
            const matchesTransaction = 
                transactionFilter === "all" ||
                (transactionFilter === "buy" && isBuy) ||
                (transactionFilter === "sell" && !isBuy);

            // Category filter
            const matchesCategory = categoryFilter === "all" || trade.category === categoryFilter;

            // Minimum quantity filter
            const matchesQuantity = !minQuantity || 
                (trade.numberOfSecurities && trade.numberOfSecurities >= Number(minQuantity));

            return matchesCompany && matchesTransaction && matchesCategory && matchesQuantity;
        });
    }, [trades, searchCompany, transactionFilter, categoryFilter, minQuantity]);

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
        setCategoryFilter("all");
        setMinQuantity("");
    };

    const hasActiveFilters = searchCompany || transactionFilter !== "all" || categoryFilter !== "all" || minQuantity;

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Insider Trading Activity (24h)</h2>
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
                            placeholder="Company name or code..."
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

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Insider Category
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map(category => (
                                <option key={category} value={category!}>
                                    {category}
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
                        {categoryFilter !== "all" && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {categoryFilter}
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