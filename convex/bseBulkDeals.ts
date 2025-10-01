import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const checkExists = query({
  args: {
    scripCode: v.string(),
    clientName: v.string(),
    date: v.string(),
    quantity: v.float64(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bseBulkDeals")
      .withIndex("by_scripCode", (q) => q.eq("scripCode", args.scripCode))
      .filter((q) =>
        q.and(
          q.eq(q.field("clientName"), args.clientName),
          q.eq(q.field("date"), args.date),
          q.eq(q.field("quantity"), args.quantity)
        )
      )
      .first();

    return !!existing;
  },
});

export const insert = mutation({
  args: {
    scripCode: v.string(),
    companyName: v.string(),
    clientName: v.string(),
    dealType: v.string(),
    quantity: v.float64(),
    price: v.float64(),
    totalValue: v.float64(),
    date: v.union(v.string(), v.null()),
    dateText: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("bseBulkDeals", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const deals = await ctx.db
      .query("bseBulkDeals")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);
    return deals;
  },
});

export const getByCompany = query({
  args: { scripCode: v.string() },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("bseBulkDeals")
      .withIndex("by_scripCode", (q) => q.eq("scripCode", args.scripCode))
      .order("desc")
      .collect();
    return deals;
  },
});

export const getByClient = query({
  args: { clientName: v.string() },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("bseBulkDeals")
      .withIndex("by_clientName", (q) => q.eq("clientName", args.clientName))
      .order("desc")
      .collect();
    return deals;
  },
});

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("bseBulkDeals")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    return deals;
  },
});
