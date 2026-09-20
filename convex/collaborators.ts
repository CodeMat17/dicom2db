import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCollaborators = query({
  handler: async (ctx) => {
    const collabo = await ctx.db.query("collaborators").order("asc").collect();

    const collaboUrls = await Promise.all(
      collabo.map(async (collab) => {
        // Cloudinary first, legacy Convex file as the fallback.
        const imgUrl =
          collab.imageUrl ??
          (collab.logo ? await ctx.storage.getUrl(collab.logo) : null);

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
    imageUrl: v.string(),
    imagePublicId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("collaborators", args);
  },
});

export const deleteCollaborator = mutation({
  args: {
    id: v.id("collaborators"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Collaborator not found");

    if (existing.logo) {
      await ctx.storage.delete(existing.logo).catch((error) => {
        console.error("Failed to delete legacy logo:", error);
      });
    }

    await ctx.db.delete(args.id);
    return { deletedPublicId: existing.imagePublicId ?? null };
  },
});

export const updateCollaborator = mutation({
  args: {
    id: v.id("collaborators"),
    name: v.string(),
    office: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, office, imageUrl, imagePublicId }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Collaborator not found");
    }

    const replacing = !!imageUrl && imageUrl !== existing.imageUrl;

    if (replacing && existing.logo) {
      await ctx.storage.delete(existing.logo).catch((error) => {
        console.error("Failed to delete old logo:", error);
      });
    }

    await ctx.db.patch(id, {
      name,
      office,
      ...(replacing ? { imageUrl, imagePublicId, logo: undefined } : {}),
    });

    return {
      replacedPublicId: replacing ? (existing.imagePublicId ?? null) : null,
    };
  },
});
