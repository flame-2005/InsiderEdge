import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
});
