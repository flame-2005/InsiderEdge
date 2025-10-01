// convex/notification.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { sendInsiderEmailResend } from "../utils/sendViaResend";

// convex/notification.ts
export const notifyInsiderInsert = action({
  args: { id: v.id("unifiedInsider") },
  handler: async (ctx, { id }) => {
    const rec = await ctx.runQuery(api.unifiedInsiderTrading.getById, { id });
    if (!rec) return;
    const recipients = await ctx.runQuery(api.user.getAllEmails);
    if (!recipients.length) return;
    await sendInsiderEmailResend(rec, recipients);
  },
});
