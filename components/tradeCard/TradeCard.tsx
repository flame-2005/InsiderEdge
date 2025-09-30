"use client"

import { BseInsiderTrade } from "@/constants/company";
import React from "react";

type TradeCardProps = {
    trade: BseInsiderTrade;
};

const formatNumber = (num: number | null): string => {
    if (!num) return "0";
    return num.toLocaleString("en-IN");
};

const getTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return "recently";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return "recently";
};

export function TradeCard({ trade }: TradeCardProps) {
    const isBuy = trade.transactionType?.toLowerCase().includes("acquisition") ||
        trade.transactionType?.toLowerCase().includes("buy");
    const action = isBuy ? "bought" : "sold";
    const bgColor = isBuy ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
    const iconColor = isBuy ? "text-green-600" : "text-red-600";
    const icon = isBuy ? "↗" : "↘";

    return (
        <div
            className={`border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${bgColor}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-3xl ${iconColor}`}>{icon}</span>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">
                                {trade.personName || "Unknown Person"}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {trade.category || "Insider"} • {trade.companyName || "Unknown Company"}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-800 mt-3 text-base leading-relaxed">
                        <span className="font-semibold">{action}</span>{" "}
                        <span className={`font-bold ${iconColor}`}>
                            {formatNumber(trade.numberOfSecurities)}
                        </span>{" "}
                        {trade.securityType || "shares"} of{" "}
                        <span className="font-semibold">{trade.companyName}</span>
                        {trade.valuePerSecurity && trade.numberOfSecurities && (
                            <span className="text-gray-600">
                                {" "}at ₹{(trade.valuePerSecurity / trade.numberOfSecurities).toFixed(2)} per share
                            </span>
                        )}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                            📊 {trade.scripCode}
                        </span>
                        {trade.modeOfAcquisition && (
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                                {trade.modeOfAcquisition}
                            </span>
                        )}
                        <span className="px-3 py-1 bg-white rounded-full text-gray-600 border">
                            🕐 {getTimeAgo(trade.dateOfIntimation)}
                        </span>
                    </div>

                    {(trade.securitiesHeldPostTransaction || trade.securitiesHeldPostPercentage) && (
                        <div className="mt-3 text-sm text-gray-600 bg-white/50 rounded-lg p-3">
                            <span className="font-medium">Post-transaction holdings:</span>{" "}
                            {formatNumber(trade.securitiesHeldPostTransaction)}
                            {trade.securitiesHeldPostPercentage && (
                                <span> ({trade.securitiesHeldPostPercentage}%)</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}