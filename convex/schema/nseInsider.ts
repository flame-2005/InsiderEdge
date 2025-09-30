import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  insiderTrades: defineTable({
    symbol: v.string(),
    companyName: v.string(),
    acquirerOrDisposer: v.string(),
    regulation: v.string(),
    securityType: v.string(),
    quantity: v.number(),
    transactionType: v.string(),
    disclosedAt: v.string(), // ISO date
    xbrlLink: v.optional(v.string()),
  })
    // prevent duplicate records (symbol+disclosedAt+quantity for example)
    .index("by_symbol_date", ["symbol", "disclosedAt"]),
});
