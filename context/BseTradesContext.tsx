"use client"

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BseBulkDeals, BseInsiderTrade } from "@/constants/company";

type BseTradesContextType = {
  trades: BseInsiderTrade[] | undefined;
  BseBulkDeals : BseBulkDeals[] | undefined;
  isLoading: boolean;
};

const BseTradesContext = createContext<BseTradesContextType | undefined>(undefined);

export function BseTradesProvider({ children }: { children: ReactNode }) {
  const trades = useQuery(api.bseInsiderTrading.getRecent24Hours);
  const BseBulkDeals = useQuery(api.bseBulkDeals.getAll);
  
  return (
    <BseTradesContext.Provider value={{ 
      trades, 
      BseBulkDeals,
      isLoading: trades === undefined 
    }}>
      {children}
    </BseTradesContext.Provider>
  );
}

export function useBseTrades() {
  const context = useContext(BseTradesContext);
  if (context === undefined) {
    throw new Error("useBseTrades must be used within BseTradesProvider");
  }
  return context;
}
