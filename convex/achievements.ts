// convex/achievements.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

/**
 * Cover photos live in Cloudinary. Rows written before the move still point
 * at a Convex file, so every read resolves Cloudinary first and falls back to
 * storage until `scripts/migrate-to-cloudinary` has copied them over.
 */
const resolvePhotoUrl = async (ctx: QueryCtx, achievement: Doc<"achievements">) =>
  achievement.imageUrl ??
  (achievement.photo ? await ctx.storage.getUrl(achievement.photo) : null);

export const getLatestAchievements = query({
  handler: async (ctx) => {
    const achievements = await ctx.db
      .query("achievements")
      .order("desc")
      .take(3);

    return await Promise.all(
      achievements.map(async (achievement) => ({
        _id: achievement._id,
        title: achievement.title,
        description: achievement.description,
        slug: achievement.slug,
        date: achievement._creationTime,
        publishedAt: achievement.publishedAt,
        photoUrl: await resolvePhotoUrl(ctx, achievement),
      }))
    );
  },
});

export const getAllAchievements = query({
  handler: async (ctx) => {
    const achievements = await ctx.db
      .query("achievements")
      .order("desc")
      .collect();

    return await Promise.all(
      achievements.map(async (achievement) => ({
        _id: achievement._id,
        date: achievement._creationTime,
        title: achievement.title,
        description: achievement.description,
        slug: achievement.slug,
        photoUrl: await resolvePhotoUrl(ctx, achievement),
        publishedAt: achievement.publishedAt,
        _creationTime: achievement._creationTime,
      }))
    );
  },
});

// Query to get full achievement by slug
export const getAchievementBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const achievement = await ctx.db
      .query("achievements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!achievement) {
      return null;
    }

    return {
      ...achievement,
      photoUrl: await resolvePhotoUrl(ctx, achievement),
    };
  },
});

export const addStory = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    story: v.optional(v.string()),
    imageUrl: v.string(),
    imagePublicId: v.string(),
    publishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim() || !args.slug.trim() || !args.imageUrl) {
      throw new Error("Title, slug, and photo are required");
    }

    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`Slug "${args.slug}" already exists`);
    }

    return await ctx.db.insert("achievements", {
      title: args.title,
      description: args.description,
      slug: args.slug,
      story: args.story?.trim() || undefined,
      imageUrl: args.imageUrl,
      imagePublicId: args.imagePublicId,
      publishedAt: args.publishedAt,
    });
  },
});

export const deleteAchievement = mutation({
  args: {
    id: v.id("achievements"),
  },
  handler: async (ctx, args) => {
    const achievement = await ctx.db.get(args.id);

    if (!achievement) {
      throw new Error("Achievement not found");
    }

    if (achievement.photo) {
      await ctx.storage.delete(achievement.photo).catch((error) => {
        console.error("Failed to delete legacy photo:", error);
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
      deletedId: args.id,
      // The dashboard purges the Cloudinary asset; only it holds the secret.
      deletedPublicId: achievement.imagePublicId ?? null,
    };
  },
});

export const updateAchievement = mutation({
  args: {
    id: v.id("achievements"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    story: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Achievement not found");
    }

    const replacing = !!args.imageUrl && args.imageUrl !== existing.imageUrl;

    if (replacing && existing.photo) {
      await ctx.storage.delete(existing.photo).catch((error) => {
        console.error("Failed to delete legacy photo:", error);
      });
    }

    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      slug: args.slug.toLowerCase().trim(),
      description: args.description.trim(),
      story: args.story?.trim(),
      ...(replacing
        ? {
            imageUrl: args.imageUrl,
            imagePublicId: args.imagePublicId,
            photo: undefined,
          }
        : {}),
    });

    return {
      replacedPublicId: replacing ? (existing.imagePublicId ?? null) : null,
    };
  },
});

export const getAllAchievementsWithPhotos = query({
  handler: async (ctx) => {
    const achievements = await ctx.db
      .query("achievements")
      .order("desc")
      .collect();

    return await Promise.all(
      achievements.map(async (achievement) => ({
        _id: achievement._id,
        title: achievement.title,
        description: achievement.description,
        slug: achievement.slug,
        date: achievement.publishedAt,
        photoUrl: await resolvePhotoUrl(ctx, achievement),
      }))
    );
  },
});
