import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ------------------- BSE Insider Trading -------------------
  bseInsiderTrading: defineTable({
    scripCode: v.union(v.string(), v.null()),
    companyName: v.union(v.string(), v.null()),
    personName: v.union(v.string(), v.null()),
    category: v.union(v.string(), v.null()),
    securitiesHeldPreTransaction: v.union(v.number(), v.null()),
    securitiesHeldPrePercentage: v.union(v.number(), v.null()),
    securityType: v.union(v.string(), v.null()),
    numberOfSecurities: v.union(v.number(), v.null()),
    valuePerSecurity: v.union(v.number(), v.null()),
    transactionType: v.union(v.string(), v.null()),
    securitiesHeldPostTransaction: v.union(v.number(), v.null()),
    securitiesHeldPostPercentage: v.union(v.number(), v.null()),
    dateOfAllotmentOrTransaction: v.union(v.string(), v.null()),
    dateOfAllotmentOrTransactionText: v.union(v.string(), v.null()),
    modeOfAcquisition: v.union(v.string(), v.null()),
    derivativeType: v.union(v.string(), v.null()),
    buyValueUnits: v.union(v.string(), v.null()),
    sellValueUnits: v.union(v.string(), v.null()),
    dateOfIntimation: v.union(v.string(), v.null()),
    dateOfIntimationText: v.union(v.string(), v.null()),
    createdAt: v.number(),
  })
    .index("by_scripCode", ["scripCode"])
    .index("by_dateOfIntimation", ["dateOfIntimation"])
    .index("by_createdAt", ["createdAt"]),

  // ------------------- NSE Insider Trading -------------------
  nseInsiderTrading: defineTable({
    symbol: v.string(),
    companyName: v.string(),
    acquirerOrDisposer: v.string(),
    regulation: v.string(),
    securityType: v.string(),
    quantity: v.number(),
    createdAt: v.number(),
    transactionType: v.string(),
    disclosedAt: v.string(), // ISO date
    xbrlLink: v.optional(v.string()),
  }).index("by_symbol_date", ["symbol", "disclosedAt"]),

  // ------------------- Unified Insider Trading -------------------
  unifiedInsider: defineTable({
    exchange: v.string(),

    scripCode: v.string(),
    companyName: v.string(),
    personName: v.string(),
    category: v.string(),
    securityType: v.string(),
    numberOfSecurities: v.number(),
    transactionType: v.string(),
    transactionDate: v.string(),
    transactionDateText: v.union(v.string(), v.null()),
    securitiesHeldPreTransaction: v.union(v.number(), v.null()),
    securitiesHeldPrePercentage: v.union(v.number(), v.null()),
    valuePerSecurity: v.union(v.number(), v.null()),
    securitiesHeldPostTransaction: v.union(v.number(), v.null()),
    securitiesHeldPostPercentage: v.union(v.number(), v.null()),
    modeOfAcquisition: v.union(v.string(), v.null()),
    derivativeType: v.union(v.string(), v.null()),
    buyValueUnits: v.union(v.string(), v.null()),
    sellValueUnits: v.union(v.string(), v.null()),

    xbrlLink: v.union(v.string(), v.null()),

    createdAt: v.number(),
  })
    .index("by_exchange", ["exchange"])
    .index("by_scripCode", ["scripCode"])
    .index("by_exchange_date", ["exchange", "transactionDate"])
    .index("by_createdAt", ["createdAt"]),

  // ------------------- Users -------------------
  users: defineTable({
    supabaseId: v.string(),
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_supabaseId", ["supabaseId"])
    .index("by_email", ["email"]),

  bseBulkDeals: defineTable({
    scripCode: v.string(),
    companyName: v.string(),
    clientName: v.string(),
    dealType: v.string(),
    quantity: v.float64(),
    price: v.float64(),
    totalValue: v.float64(),
    date: v.union(v.string(), v.null()),
    dateText: v.string(),
    createdAt: v.float64(),
  })
    .index("by_scripCode", ["scripCode"])
    .index("by_date", ["date"])
    .index("by_clientName", ["clientName"])
    .index("by_createdAt", ["createdAt"]),
});
