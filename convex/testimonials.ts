import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTestimonials = query({
  handler: async (ctx) => {
    return await ctx.db.query("testimonials").collect();
  },
});

export const addTestimonial = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("testimonials", {
      name: args.name,
      role: args.role,
      body: args.body,
    });
  },
});

export const deleteTestimonial = mutation({
  args: {
    id: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateTestimonial = mutation({
  args: {
    id: v.id("testimonials"),
    name: v.string(),
    role: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { id, name, role, body }) => {
    await ctx.db.patch(id, { name, role, body });
  },
});