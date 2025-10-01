"use client"

import React, { useState } from "react";

// Mock type definition for the trade
type BseInsiderTrade = {
    personName: string | null;
    category: string | null;
    companyName: string | null;
    transactionType: string | null;
    numberOfSecurities: number | null;
    securityType: string | null;
    valuePerSecurity: number | null;
    scripCode: string | null;
    modeOfAcquisition: string | null;
    dateOfIntimation: string | null;
    securitiesHeldPostTransaction: number | null;
    securitiesHeldPostPercentage: number | null;
    securitiesHeldPreTransaction?: number | null;
};

type TradeCardProps = {
    trade: BseInsiderTrade;
};

const formatNumber = (num: number | null): string => {
    if (!num) return "0";
    return num.toLocaleString("en-IN");
};

const formatCurrency = (num: number | null): string => {
    if (!num) return "₹0";
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    return `₹${num.toLocaleString("en-IN")}`;
};

const getTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return "recently";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN");
};

// Hover tooltip component
const StatsTooltip = ({ 
    trade
}: { 
    trade: BseInsiderTrade;
}) => {
    const pricePerShare = trade.valuePerSecurity && trade.numberOfSecurities 
        ? trade.valuePerSecurity / trade.numberOfSecurities 
        : 0;
    
    const totalValue = trade.valuePerSecurity || 0;
    const isBuy = trade.transactionType?.toLowerCase().includes("acquisition") ||
        trade.transactionType?.toLowerCase().includes("buy");
    
    const preHolding = trade.securitiesHeldPreTransaction || 
        (trade.securitiesHeldPostTransaction && trade.numberOfSecurities 
            ? isBuy 
                ? trade.securitiesHeldPostTransaction - trade.numberOfSecurities 
                : trade.securitiesHeldPostTransaction + trade.numberOfSecurities
            : 0);
    const postHolding = trade.securitiesHeldPostTransaction || 0;
    const changePercent = preHolding > 0 
        ? (((postHolding - preHolding) / preHolding) * 100)
        : 0;

    return (
        <div 
            className="absolute top-4 right-4 z-20 bg-gray-900 text-white rounded-xl shadow-2xl p-4 w-72"
        >
            <div className="space-y-3">
                <div className="border-b border-gray-700 pb-2">
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Transaction Details</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-gray-400">Price/Share</p>
                        <p className="font-semibold text-lg">₹{pricePerShare.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Total Value</p>
                        <p className="font-semibold text-lg">{formatCurrency(totalValue)}</p>
                    </div>
                </div>

                {trade.securitiesHeldPostPercentage && (
                    <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-2">Ownership Distribution</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-blue-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(trade.securitiesHeldPostPercentage, 100)}%` }}
                                />
                            </div>
                            <span className="font-bold text-sm">{trade.securitiesHeldPostPercentage.toFixed(2)}%</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-gray-400">Pre-Holdings</p>
                        <p className="font-medium">{formatNumber(preHolding)}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Post-Holdings</p>
                        <p className="font-medium">{formatNumber(postHolding)}</p>
                    </div>
                </div>

                {changePercent !== 0 && (
                    <div className="bg-blue-900/30 rounded-lg p-2 border border-blue-700/50">
                        <p className="text-gray-300 text-xs">
                            Holdings change: <span className={`font-bold ${changePercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export function TradeCard({ trade }: TradeCardProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const isBuy = trade.transactionType?.toLowerCase().includes("acquisition") ||
        trade.transactionType?.toLowerCase().includes("buy");
    const action = isBuy ? "Acquired" : "Sold";
    
    const handleMouseEnter = () => {
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    const pricePerShare = trade.valuePerSecurity && trade.numberOfSecurities 
        ? trade.valuePerSecurity / trade.numberOfSecurities 
        : 0;

    return (
        <>
            <div
                className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer group overflow-visible"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Tooltip */}
                {showTooltip && <StatsTooltip trade={trade} />}
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            isBuy ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                            {isBuy ? '📈' : '📉'}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                {trade.personName || "Unknown Person"}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {trade.category || "Insider"}
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                        {action}
                    </div>
                </div>

                {/* Main Transaction Info */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-3xl font-bold ${isBuy ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatNumber(trade.numberOfSecurities)}
                        </span>
                        <span className="text-gray-600 text-sm font-medium">
                            {trade.securityType || "shares"}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700">
                        of <span className="font-semibold text-gray-900">{trade.companyName}</span>
                    </p>
                    {pricePerShare > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                            @ ₹{pricePerShare.toFixed(2)} per share • {formatCurrency(trade.valuePerSecurity)}
                        </p>
                    )}
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        <span>📊</span>
                        {trade.scripCode}
                    </span>
                    {trade.modeOfAcquisition && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                            {trade.modeOfAcquisition}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                        <span>🕐</span>
                        {getTimeAgo(trade.dateOfIntimation)}
                    </span>
                </div>

                {/* Post-Transaction Holdings */}
                {(trade.securitiesHeldPostTransaction || trade.securitiesHeldPostPercentage) && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-indigo-900 mb-2">Post-Transaction Holdings</p>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-indigo-900">
                                {formatNumber(trade.securitiesHeldPostTransaction)}
                            </span>
                            {trade.securitiesHeldPostPercentage && (
                                <span className="px-2.5 py-1 bg-indigo-200 text-indigo-900 rounded-lg text-sm font-bold">
                                    {trade.securitiesHeldPostPercentage.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Hover indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="text-gray-400 text-xs">
                        ℹ️ Hover for details
                    </div>
                </div>
            </div>
        </>
    );
}

// Demo component
export default function TradeCardDemo() {
    const sampleTrade: BseInsiderTrade = {
        personName: "Rajesh Kumar",
        category: "Promoter",
        companyName: "Tech Innovations Ltd",
        transactionType: "Acquisition",
        numberOfSecurities: 50000,
        securityType: "Equity Shares",
        valuePerSecurity: 7500000,
        scripCode: "TECHIN",
        modeOfAcquisition: "Market Purchase",
        dateOfIntimation: "2025-09-28T10:30:00",
        securitiesHeldPostTransaction: 2500000,
        securitiesHeldPostPercentage: 12.5,
        securitiesHeldPreTransaction: 2450000
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Insider Trade Card</h1>
                <p className="text-gray-600 mb-8">Hover over the card to see detailed statistics</p>
                <TradeCard trade={sampleTrade} />
            </div>
        </div>
    );
}