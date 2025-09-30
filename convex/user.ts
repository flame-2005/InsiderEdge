import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: {
    supabaseId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { supabaseId, email, name }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", supabaseId))
      .first();

    if (!existing) {
      return await ctx.db.insert("users", {
        supabaseId,
        email,
        name,
        createdAt: Date.now(),
      });
    }

    // update name if changed
    await ctx.db.patch(existing._id, { name });
    return existing._id;
  },
});


export const getUserBySupabaseId = query({
  args: { supabaseId: v.string() },
  handler: async (ctx, { supabaseId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", supabaseId))
      .first();
  },
});
