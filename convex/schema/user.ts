import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    supabaseId: v.string(), 
    name:v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_supabaseId", ["supabaseId"]),
});
