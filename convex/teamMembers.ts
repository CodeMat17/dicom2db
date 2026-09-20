import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export type Staff = Doc<"teamMembers">;

export const getTeam = query({
  handler: async (ctx) => {
    const [directorResult, staff] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_role", (q) => q.eq("role", "director"))
        .first(),

      ctx.db
        .query("teamMembers")
        .withIndex("by_role", (q) => q.eq("role", "staff"))
        .collect(),
    ]);

    // Cloudinary first, legacy Convex file as the fallback.
    const resolveImageUrl = async (member: Staff) => ({
      ...member,
      imageUrl:
        member.imageUrl ??
        (member.image ? await ctx.storage.getUrl(member.image) : null),
    });

    const director = directorResult
      ? await resolveImageUrl(directorResult)
      : null;

    const staffWithImages = await Promise.all(staff.map(resolveImageUrl));

    return {
      director,
      staff: staffWithImages,
    };
  },
});

export const addStaff = mutation({
  args: {
    name: v.string(),
    position: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.string(),
    imagePublicId: v.string(),
    profile: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("teamMembers", {
      ...args,
      role: "staff",
    });
  },
});

export const updateStaff = mutation({
  args: {
    id: v.id("teamMembers"),
    name: v.string(),
    position: v.string(),
    email: v.optional(v.string()),
    profile: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Staff member not found");
    }

    const replacing = !!args.imageUrl && args.imageUrl !== existing.imageUrl;

    if (replacing && existing.image) {
      await ctx.storage.delete(existing.image).catch((error) => {
        console.error("Failed to delete legacy staff photo:", error);
      });
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      position: args.position,
      email: args.email,
      profile: args.profile,
      ...(replacing
        ? {
            imageUrl: args.imageUrl,
            imagePublicId: args.imagePublicId,
            image: undefined,
          }
        : {}),
    });

    return {
      replacedPublicId: replacing ? (existing.imagePublicId ?? null) : null,
    };
  },
});

export const deleteStaff = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Staff member not found");
    }

    if (existing.image) {
      await ctx.storage.delete(existing.image).catch((error) => {
        console.error("Failed to delete legacy staff photo:", error);
      });
    }

    await ctx.db.delete(args.id);
    return { deletedPublicId: existing.imagePublicId ?? null };
  },
});
