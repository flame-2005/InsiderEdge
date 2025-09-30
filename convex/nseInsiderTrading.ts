import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Insert multiple trades (skip duplicates)
export const insertTrades = mutation({
  args: {
    trades: v.array(
      v.object({
        symbol: v.string(),
        companyName: v.string(),
        acquirerOrDisposer: v.string(),
        regulation: v.string(),
        securityType: v.string(),
        quantity: v.number(),
        transactionType: v.string(),
        disclosedAt: v.string(), // ISO date string
        xbrlLink: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { trades }) => {
    for (const trade of trades) {
      const existing = await ctx.db
        .query("nseInsiderTrading")
        .filter((q) =>
          q.and(
            q.eq(q.field("symbol"), trade.symbol),
            q.eq(q.field("acquirerOrDisposer"), trade.acquirerOrDisposer),
            q.eq(q.field("disclosedAt"), trade.disclosedAt),
            q.eq(q.field("quantity"), trade.quantity)
          )
        )
        .first();

      if (!existing) {
        await ctx.db.insert("nseInsiderTrading", {
          ...trade,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// Check if one trade exists
export const checkExists = query({
  args: {
    symbol: v.string(),
    acquirerOrDisposer: v.string(),
    disclosedAt: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nseInsiderTrading")
      .filter((q) =>
        q.and(
          q.eq(q.field("symbol"), args.symbol),
          q.eq(q.field("acquirerOrDisposer"), args.acquirerOrDisposer),
          q.eq(q.field("disclosedAt"), args.disclosedAt),
          q.eq(q.field("quantity"), args.quantity)
        )
      )
      .first();

    return existing !== null;
  },
});

// Get latest 100 trades
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("nseInsiderTrading")
      .order("desc")
      .take(100);
  },
});

// Get trades by symbol
export const getBySymbol = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nseInsiderTrading")
      .filter((q) => q.eq(q.field("symbol"), args.symbol))
      .order("desc")
      .collect();
  },
});

// Get trades inserted in the last 24 hours
export const getRecent24Hours = query({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("nseInsiderTrading")
      .filter((q) => q.gte(q.field("createdAt"), twentyFourHoursAgo))
      .order("desc")
      .collect();
  },
});
