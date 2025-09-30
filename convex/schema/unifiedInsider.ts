import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  unifiedInsiderTrading: defineTable({
    exchange: v.string(), 

    scripCode: v.string(),
    companyName: v.string(),
    personName: v.string(), 
    category: v.string(), 
    securityType: v.string(),
    numberOfSecurities: v.number(),
    transactionType: v.string(),
    transactionDate: v.string(),
    transactionDateText: v.string(), 
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
});