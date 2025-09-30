import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const insert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bseInsiderTrading", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const checkExists = query({
  args: {
    scripCode: v.union(v.string(), v.null()),
    personName: v.union(v.string(), v.null()),
    dateOfIntimation: v.union(v.string(), v.null()),
    numberOfSecurities: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bseInsiderTrading")
      .filter((q) =>
        q.and(
          q.eq(q.field("scripCode"), args.scripCode),
          q.eq(q.field("personName"), args.personName),
          q.eq(q.field("dateOfIntimation"), args.dateOfIntimation),
          q.eq(q.field("numberOfSecurities"), args.numberOfSecurities)
        )
      )
      .first();
    
    return existing !== null;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bseInsiderTrading")
      .order("desc")
      .take(100);
  },
});

export const getByScripCode = query({
  args: { scripCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bseInsiderTrading")
      .filter((q) => q.eq(q.field("scripCode"), args.scripCode))
      .order("desc")
      .collect();
  },
});

export const getRecent24Hours = query({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    return await ctx.db
      .query("bseInsiderTrading")
      .filter((q) => q.gte(q.field("createdAt"), twentyFourHoursAgo))
      .order("desc")
      .collect();
  },
});