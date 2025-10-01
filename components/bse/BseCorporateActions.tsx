"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, Building2, TrendingUp, Award, Scissors, DollarSign, Users, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

type PurposeBadge = {
    bg: string;
    text: string;
    icon: React.ReactNode;
}

export default function BseCorporateActionsCard() {
    const actions = useQuery(api.bseCorporateActions.getAll);
    const [searchTerm, setSearchTerm] = useState("");
    const [purposeFilter, setPurposeFilter] = useState<string>("all");

    const getPurposeBadge = (purpose?: string | null): PurposeBadge => {
        if (!purpose) return { 
            bg: "bg-gray-100 border-gray-200", 
            text: "text-gray-700",
            icon: <Building2 className="w-3.5 h-3.5" />
        };

        const lowerPurpose = purpose.toLowerCase();

        if (lowerPurpose.includes("dividend")) {
            return { 
                bg: "bg-emerald-100 border-emerald-200", 
                text: "text-emerald-700",
                icon: <DollarSign className="w-3.5 h-3.5" />
            };
        } else if (lowerPurpose.includes("bonus")) {
            return { 
                bg: "bg-blue-100 border-blue-200", 
                text: "text-blue-700",
                icon: <Award className="w-3.5 h-3.5" />
            };
        } else if (lowerPurpose.includes("split")) {
            return { 
                bg: "bg-purple-100 border-purple-200", 
                text: "text-purple-700",
                icon: <Scissors className="w-3.5 h-3.5" />
            };
        } else if (lowerPurpose.includes("buyback")) {
            return { 
                bg: "bg-orange-100 border-orange-200", 
                text: "text-orange-700",
                icon: <TrendingUp className="w-3.5 h-3.5" />
            };
        } else if (lowerPurpose.includes("agm") || lowerPurpose.includes("egm")) {
            return { 
                bg: "bg-indigo-100 border-indigo-200", 
                text: "text-indigo-700",
                icon: <Users className="w-3.5 h-3.5" />
            };
        }

        return { 
            bg: "bg-gray-100 border-gray-200", 
            text: "text-gray-700",
            icon: <Building2 className="w-3.5 h-3.5" />
        };
    };

    // Get standardized purposes for filter
    const standardPurposes = [
        "Dividend",
        "Bonus",
        "Stock Split",
        "Buyback",
        "AGM/EGM",
        "Rights Issue",
        "Other"
    ];

    // Standardize purpose for filtering
    const getStandardPurpose = (purpose?: string | null): string => {
        if (!purpose) return "Other";
        const lower = purpose.toLowerCase();
        
        if (lower.includes("dividend")) return "Dividend";
        if (lower.includes("bonus")) return "Bonus";
        if (lower.includes("split")) return "Stock Split";
        if (lower.includes("buyback")) return "Buyback";
        if (lower.includes("agm") || lower.includes("egm")) return "AGM/EGM";
        if (lower.includes("right")) return "Rights Issue";
        
        return "Other";
    };

    // Filter actions
    const filteredActions = useMemo(() => {
        if (!actions) return [];
        
        return actions.filter(action => {
            const matchesSearch = !searchTerm || 
                action.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                action.scripCode?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const standardPurpose = getStandardPurpose(action.purpose);
            const matchesPurpose = purposeFilter === "all" || standardPurpose === purposeFilter;
            
            return matchesSearch && matchesPurpose;
        });
    }, [actions, searchTerm, purposeFilter]);

    if (actions === undefined) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="h-48 bg-gray-200 rounded-xl"></div>
                            <div className="h-48 bg-gray-200 rounded-xl"></div>
                            <div className="h-48 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (actions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Corporate Actions</h2>
                        <p className="text-gray-600">No corporate actions found at this time</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Corporate Actions
                    </h2>
                    <p className="text-gray-600 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        BSE Listed Companies
                    </p>
                </div>
                <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border-2 border-gray-200 shadow-sm">
                    {filteredActions.length} of {actions.length} actions
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-lg text-gray-900">Filter Actions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Search Company
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Company name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Purpose Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Action Type
                        </label>
                        <select
                            value={purposeFilter}
                            onChange={(e) => setPurposeFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                            <option value="all">All Actions</option>
                            {standardPurposes.map(purpose => (
                                <option key={purpose} value={purpose}>
                                    {purpose}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results */}
            {filteredActions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No matches found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredActions.map((action) => {
                        const badge = getPurposeBadge(action.purpose);

                        return (
                            <div
                                key={action._id}
                                className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                            {action.companyName}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">
                                            Code: <span className="text-gray-700">{action.scripCode}</span>
                                        </p>
                                    </div>
                                </div>

                                {action.purpose && (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border mb-4 ${badge.bg} ${badge.text}`}>
                                        {badge.icon}
                                        <span>{action.purpose}</span>
                                    </div>
                                )}

                                <div className="space-y-3 text-sm">
                                    {action.exDateText && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium">Ex-Date:</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{action.exDateText}</span>
                                        </div>
                                    )}

                                    {action.recordDate && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium">Record Date:</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{action.recordDate}</span>
                                        </div>
                                    )}

                                    {(action.bcStartDate || action.bcEndDate) && (
                                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium text-xs">Book Closure:</span>
                                            </div>
                                            <span className="font-semibold text-blue-900 text-sm">
                                                {action.bcStartDate} {action.bcEndDate && `to ${action.bcEndDate}`}
                                            </span>
                                        </div>
                                    )}

                                    {(action.ndStartDate || action.ndEndDate) && (
                                        <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 text-purple-700 mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium text-xs">ND Period:</span>
                                            </div>
                                            <span className="font-semibold text-purple-900 text-sm">
                                                {action.ndStartDate} {action.ndEndDate && `to ${action.ndEndDate}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}