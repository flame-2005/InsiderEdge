"use client";

import { useState, useMemo, useContext } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, TrendingUp, TrendingDown, Filter, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { useBseTrades } from "@/context/BseTradesContext";

export default function BseBulkDealsCard() {
  const {BseBulkDeals} = useBseTrades()
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minValue, setMinValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    if (!BseBulkDeals) return null;
    
    const buyDeals = BseBulkDeals.filter(d => d.dealType === "B");
    const sellDeals = BseBulkDeals.filter(d => d.dealType === "S");
    
    return {
      totalDeals: BseBulkDeals.length,
      buyDeals: buyDeals.length,
      sellDeals: sellDeals.length,
      totalBuyValue: buyDeals.reduce((sum, d) => sum + d.totalValue, 0),
      totalSellValue: sellDeals.reduce((sum, d) => sum + d.totalValue, 0),
      avgDealSize: BseBulkDeals.reduce((sum, d) => sum + d.totalValue, 0) / BseBulkDeals.length,
    };
  }, [BseBulkDeals]);

  // Filter and sort BseBulkDeals
  const filteredDeals = useMemo(() => {
    if (!BseBulkDeals) return [];
    
    const filtered = BseBulkDeals.filter(deal => {
      const matchesSearch = 
        deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.scripCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || deal.dealType === filterType;
      
      const matchesMinValue = !minValue || deal.totalValue >= parseFloat(minValue);
      
      return matchesSearch && matchesType && matchesMinValue;
    });

    // Sort BseBulkDeals
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(b.dateText).getTime() - new Date(a.dateText).getTime();
          break;
        case "value":
          comparison = b.totalValue - a.totalValue;
          break;
        case "quantity":
          comparison = b.quantity - a.quantity;
          break;
      }
      
      return sortOrder === "desc" ? comparison : -comparison;
    });

    return filtered;
  }, [BseBulkDeals, searchTerm, filterType, sortBy, sortOrder, minValue]);

  if (BseBulkDeals === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading bulk Deals...</p>
        </div>
      </div>
    );
  }

  if (BseBulkDeals.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-2xl">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">No bulk BseBulkDeals found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            BSE Bulk Deals
          </h2>
          <p className="text-gray-600 mt-1">Real-time bulk transaction insights</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm font-medium">Total Deals</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDeals}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
            <p className="text-green-700 text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Buy Deals
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.buyDeals}</p>
            <p className="text-xs text-green-600 mt-1">
              ₹{(stats.totalBuyValue / 10000000).toFixed(2)}Cr
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
            <p className="text-red-700 text-sm font-medium flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> Sell Deals
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.sellDeals}</p>
            <p className="text-xs text-red-600 mt-1">
              ₹{(stats.totalSellValue / 10000000).toFixed(2)}Cr
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <p className="text-blue-700 text-sm font-medium">Avg Deal Size</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              ₹{(stats.avgDealSize / 10000000).toFixed(2)}Cr
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by company, client, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 flex items-center gap-2 transition-colors"
          >
            {showFilters ? <EyeOff className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            {showFilters ? "Hide" : "Show"} Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Deals</option>
                <option value="B">Buy Only</option>
                <option value="S">Sell Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="date">Date</option>
                  <option value="value">Total Value</option>
                  <option value="quantity">Quantity</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Value (₹)</label>
              <input
                type="number"
                placeholder="e.g., 10000000"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredDeals.length}</span> of{" "}
          <span className="font-semibold">{BseBulkDeals.length}</span> Deals
        </p>
      </div>

      {filteredDeals.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl">
          <p className="text-gray-500">No Deals match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDeals.map((deal) => (
            <div
              key={deal._id}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 group"
            >
              <div
                className={`p-4 ${
                  deal.dealType === "B"
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white truncate" title={deal.companyName}>
                      {deal.companyName}
                    </h3>
                    <p className="text-xs text-white/80 mt-1">Code: {deal.scripCode}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                    {deal.dealType === "B" ? "BUY" : "SELL"}
                  </span>
                </div>
              </div>

              <div className="px-5 py-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Client</span>
                  <span className="font-semibold text-gray-900 text-sm truncate ml-2 max-w-[60%]" title={deal.clientName}>
                    {deal.clientName}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Quantity</span>
                  <span className="font-semibold text-gray-900">
                    {deal.quantity.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Price</span>
                  <span className="font-semibold text-gray-900">₹{deal.price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-3 pb-2">
                  <span className="text-gray-700 font-bold text-sm">Total Value</span>
                  <span className="font-bold text-gray-900 text-lg">
                    ₹{(deal.totalValue / 10000000).toFixed(2)}Cr
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>📅 {deal.dateText}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}