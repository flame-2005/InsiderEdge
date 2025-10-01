import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Insert from BSE data
export const insertFromBse = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("unifiedInsider", {
      exchange: "BSE",
      xbrlLink: null,
      createdAt: Date.now(),
      ...args,
    });
  },
});

// Insert from NSE data
export const insertFromNse = mutation({
  args: {
    symbol: v.string(),
    companyName: v.string(),
    acquirerOrDisposer: v.string(),
    regulation: v.string(),
    securityType: v.string(),
    quantity: v.number(),
    transactionType: v.string(),
    transactionDate: v.string(),
    xbrlLink: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("unifiedInsider", {
      exchange: "NSE",
      scripCode: args.symbol,
      personName: args.acquirerOrDisposer,
      category: args.regulation,
      numberOfSecurities: args.quantity,
      companyName: args.companyName,
      securityType: args.securityType,
      transactionType: args.transactionType,
      transactionDate: args.transactionDate,
      xbrlLink: args.xbrlLink,
      // BSE-specific fields set to null
      transactionDateText: null,
      securitiesHeldPreTransaction: null,
      securitiesHeldPrePercentage: null,
      valuePerSecurity: null,
      securitiesHeldPostTransaction: null,
      securitiesHeldPostPercentage: null,
      modeOfAcquisition: null,
      derivativeType: null,
      buyValueUnits: null,
      sellValueUnits: null,
      createdAt: Date.now(),
    });
  },
});

// Check if record exists (prevent duplicates)
export const checkExists = query({
  args: {
    exchange: v.string(),
    scripCode: v.string(),
    transactionDate: v.string(),
    numberOfSecurities: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("unifiedInsider")
      .filter((q) =>
        q.and(
          q.eq(q.field("scripCode"), args.scripCode),
          q.eq(q.field("numberOfSecurities"), args.numberOfSecurities)
        )
      )
      .first();

    return existing !== null;
  },
});

// Get recent 24 hours - all exchanges
export const getRecent24Hours = query({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const results = await ctx.db
      .query("unifiedInsider")
      .filter((q) => q.gte(q.field("createdAt"), twentyFourHoursAgo))
      .collect();

    return results.sort((a, b) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      return dateB - dateA;
    });
  },
});

// Get by exchange
export const getByExchange = query({
  args: { exchange: v.string() },
  handler: async (ctx, args) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const results = await ctx.db
      .query("unifiedInsider")
      .filter((q) => q.gte(q.field("createdAt"), twentyFourHoursAgo))
      .collect();

    return results.sort((a, b) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      return dateB - dateA;
    });
  },
});

// Get by company/scripCode
export const getByScripCode = query({
  args: { scripCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("unifiedInsider")
      .collect();
  },
});

// Get all (paginated)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query("unifiedInsider")
      .order("desc")
      .collect();
    return records;
  },
});

export const getById = query({
  args: { id: v.id("unifiedInsider") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});