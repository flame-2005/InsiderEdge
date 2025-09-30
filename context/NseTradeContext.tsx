"use client"

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type NseInsiderTrade = {
  _id: string;
  _creationTime: number;
  symbol: string;
  companyName: string;
  acquirerOrDisposer: string;
  regulation: string;
  securityType: string;
  quantity: number;
  transactionType: string;
  disclosedAt: string;
  xbrlLink?: string;
};

type NseTradesContextType = {
  trades: NseInsiderTrade[] | undefined;
  isLoading: boolean;
};

const NseTradesContext = createContext<NseTradesContextType | undefined>(undefined);

export function NseTradesProvider({ children }: { children: ReactNode }) {
  const trades = useQuery(api.nseInsiderTrading.getRecent24Hours);
  
  return (
    <NseTradesContext.Provider value={{ 
      trades, 
      isLoading: trades === undefined 
    }}>
      {children}
    </NseTradesContext.Provider>
  );
}

export function useNseTrades() {
  const context = useContext(NseTradesContext);
  if (context === undefined) {
    throw new Error("useNseTrades must be used within NseTradesProvider");
  }
  return context;
}
