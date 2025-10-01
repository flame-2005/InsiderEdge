import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Check if a corporate action record already exists
export const checkExists = query({
  args: {
    scripCode: v.string(),
    purpose: v.union(v.string(), v.null()),
    exDateText: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bseCorporateActions")
      .withIndex("by_scripCode", (q) => q.eq("scripCode", args.scripCode))
      .filter((q) =>
        q.and(
          q.eq(q.field("purpose"), args.purpose),
          q.eq(q.field("exDateText"), args.exDateText)
        )
      )
      .first();

    return !!existing;
  },
});

// Insert a new corporate action record
export const insert = mutation({
  args: {
    scripCode: v.string(),
    companyName: v.union(v.string(), v.null()), // match schema
    purpose: v.union(v.string(), v.null()),
    exDate: v.union(v.string(), v.null()),
    exDateText: v.union(v.string(), v.null()),
    recordDate: v.union(v.string(), v.null()),
    bcStartDate: v.union(v.string(), v.null()),
    bcEndDate: v.union(v.string(), v.null()),
    ndStartDate: v.union(v.string(), v.null()),
    ndEndDate: v.union(v.string(), v.null()),
  },

  handler: async (ctx, args) => {
    const id = await ctx.db.insert("bseCorporateActions", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

// Get all corporate actions
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const actions = await ctx.db
      .query("bseCorporateActions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);
    return actions;
  },
});

// Get corporate actions by company
export const getByCompany = query({
  args: { scripCode: v.string() },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("bseCorporateActions")
      .withIndex("by_scripCode", (q) => q.eq("scripCode", args.scripCode))
      .order("desc")
      .collect();
    return actions;
  },
});

// Get corporate actions by purpose (e.g., "Dividend", "Bonus")
export const getByPurpose = query({
  args: { purpose: v.string() },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("bseCorporateActions")
      .withIndex("by_purpose", (q) => q.eq("purpose", args.purpose))
      .order("desc")
      .collect();
    return actions;
  },
});

// Get upcoming corporate actions (future ex-dates)
export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const actions = await ctx.db
      .query("bseCorporateActions")
      .withIndex("by_exDate")
      .filter((q) => q.gte(q.field("exDate"), now))
      .order("asc")
      .take(50);
    return actions;
  },
});
