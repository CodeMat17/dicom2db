import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all statistics
export const getAchievementsStats = query({
  handler: async (ctx) => {
    return await ctx.db.query("achievementsStats").first();
  },
});

export const updateAchievementsStats = mutation({
  args: {
    id: v.id("achievementsStats"),
    nationalChampions: v.optional(v.number()),
    internationalRecognition: v.optional(v.number()),
    studentWinners: v.optional(v.number()),
    universityAwards: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fieldsToUpdate } = args;

    // Filter out undefined fields
    const updates = Object.fromEntries(
      Object.entries(fieldsToUpdate).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields provided to update.");
    }

    await ctx.db.patch(id, updates);
  },
});
