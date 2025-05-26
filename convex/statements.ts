import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStatements = query({
  handler: async (ctx) => {
    return await ctx.db.query("statements").collect();
  },
});

export const addStatement = mutation({
  args: {
    type: v.union(
      v.literal("mission"),
      v.literal("vision"),
      v.literal("core-values")
    ),
    title: v.string(),
    content: v.optional(v.string()),
    values: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("statements", args);
  },
});

export const deleteStatement = mutation({
  args: { id: v.id("statements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateStatement = mutation({
  args: {
    id: v.id("statements"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    values: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, title, content, values } = args;
    const existing = await ctx.db.get(id);

    if (!existing) {
      throw new Error("Statement not found");
    }

    await ctx.db.patch(id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(values !== undefined && { values }),
    });
  },
});