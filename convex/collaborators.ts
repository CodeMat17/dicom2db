import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCollaborators = query({
  handler: async (ctx) => {
    const collabo = await ctx.db.query("collaborators").order("asc").collect();

    const collaboUrls = await Promise.all(
      collabo.map(async (collab) => {
        const imgUrl = collab.logo
          ? await ctx.storage.getUrl(collab.logo)
          : null;

        return {
          ...collab,
          imgUrl,
        };
      })
    );
    return collaboUrls;
  },
});

export const createCollaborator = mutation({
  args: {
    name: v.string(),
    office: v.string(),
    logo: v.id("_storage"),
  },
  handler: async (ctx, { name, office, logo }) => {
    const collaboratorId = await ctx.db.insert("collaborators", {
      name,
      office,
      logo,
    });

    return collaboratorId;
  },
});

export const deleteCollaborator = mutation({
  args: {
    id: v.id("collaborators"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateCollaborator = mutation({
  args: {
    id: v.id("collaborators"),
    name: v.string(),
    office: v.string(),
    logo: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { id, name, office, logo }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Collaborator not found");
    }

    // Only delete the old logo if we're updating to a new one
    if (logo && logo !== existing.logo) {
      try {
        await ctx.storage.delete(existing.logo);
      } catch (error) {
        // If the old logo doesn't exist, just log it and continue
        console.error("Failed to delete old logo:", error);
      }
    }

    // If no new logo is provided, keep the existing one
    const updateData = {
      name,
      office,
      ...(logo ? { logo } : {}),
    };

    await ctx.db.patch(id, updateData);

    return id;
  },
});
