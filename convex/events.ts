import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getEvents = query({
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    note: v.string(),
  },
  handler: async (ctx, { title, note }) => {
    const eventId = await ctx.db.insert("events", {
      title,
      note,
    });
    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    title: v.string(),
    note: v.string(),
  },
  handler: async (ctx, { id, title, note }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(id, {
      title,
      note,
    });

    return id;
  },
});

export const deleteEvent = mutation({
  args: {
    id: v.id("events"),
  },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    await ctx.db.delete(id);
    return id;
  },
});
