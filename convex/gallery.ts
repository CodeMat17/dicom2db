// convex/gallery.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

/**
 * Gallery photographs. The files live in Cloudinary — Convex holds the title,
 * description, dimensions and published date. Rows still pointing at a Convex
 * file are resolved through storage until the migration script copies them.
 *
 * The published date is derived rather than entered: `publishedAt` when set,
 * otherwise the row's creation time.
 */
const resolvePhotoUrl = async (ctx: QueryCtx, photo: Doc<"gallery">) =>
  photo.imageUrl ??
  (photo.photo ? await ctx.storage.getUrl(photo.photo) : null);

export const getAllPhotos = query({
  handler: async (ctx) => {
    const photos = await ctx.db.query("gallery").order("desc").collect();

    const withUrls = await Promise.all(
      photos.map(async (photo) => ({
        _id: photo._id,
        title: photo.title,
        description: photo.description,
        category: photo.category,
        width: photo.width,
        height: photo.height,
        imagePublicId: photo.imagePublicId,
        publishedAt: photo.publishedAt ?? photo._creationTime,
        photoUrl: await resolvePhotoUrl(ctx, photo),
      }))
    );

    // Newest first, honouring a backdated publish date over insertion order.
    return withUrls.sort((a, b) => b.publishedAt - a.publishedAt);
  },
});

export const getLatestPhotos = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 6 }) => {
    const photos = await ctx.db.query("gallery").order("desc").take(limit);

    return await Promise.all(
      photos.map(async (photo) => ({
        _id: photo._id,
        title: photo.title,
        description: photo.description,
        width: photo.width,
        height: photo.height,
        publishedAt: photo.publishedAt ?? photo._creationTime,
        photoUrl: await resolvePhotoUrl(ctx, photo),
      }))
    );
  },
});

export const addPhoto = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    imagePublicId: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    category: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim() || !args.imageUrl) {
      throw new Error("Title and photo are required");
    }

    return await ctx.db.insert("gallery", {
      ...args,
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category?.trim() || undefined,
      // Stamped here so a post always carries a published date.
      publishedAt: args.publishedAt ?? Date.now(),
    });
  },
});

export const updatePhoto = mutation({
  args: {
    id: v.id("gallery"),
    title: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, { id, imageUrl, imagePublicId, width, height, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Photo not found");

    const replacing = !!imageUrl && imageUrl !== existing.imageUrl;

    if (replacing && existing.photo) {
      await ctx.storage.delete(existing.photo).catch((error) => {
        console.error("Failed to delete legacy photo:", error);
      });
    }

    await ctx.db.patch(id, {
      ...fields,
      title: fields.title.trim(),
      description: fields.description.trim(),
      category: fields.category?.trim() || undefined,
      ...(replacing
        ? { imageUrl, imagePublicId, width, height, photo: undefined }
        : {}),
    });

    return {
      replacedPublicId: replacing ? (existing.imagePublicId ?? null) : null,
    };
  },
});

export const deletePhoto = mutation({
  args: { id: v.id("gallery") },
  handler: async (ctx, { id }) => {
    const photo = await ctx.db.get(id);
    if (!photo) throw new Error("Photo not found");

    if (photo.photo) {
      await ctx.storage.delete(photo.photo).catch((error) => {
        console.error("Failed to delete legacy photo file:", error);
      });
    }

    await ctx.db.delete(id);
    return { success: true, deletedPublicId: photo.imagePublicId ?? null };
  },
});

/**
 * Every row across the site that still points at a Convex file, with a
 * download URL. Feeds `scripts/migrate-to-cloudinary`.
 */
export const listLegacyImages = query({
  handler: async (ctx) => {
    const pending: {
      table: string;
      id: string;
      label: string;
      url: string | null;
    }[] = [];

    const push = async (
      table: string,
      id: string,
      label: string,
      storageId: string | null | undefined
    ) => {
      if (!storageId) return;
      pending.push({
        table,
        id,
        label,
        url: await ctx.storage.getUrl(storageId as never),
      });
    };

    for (const row of await ctx.db.query("heroSlides").collect()) {
      if (!row.imageUrl) await push("heroSlides", row._id, row.title, row.img);
    }
    for (const row of await ctx.db.query("collaborators").collect()) {
      if (!row.imageUrl)
        await push("collaborators", row._id, row.name, row.logo);
    }
    for (const row of await ctx.db.query("achievements").collect()) {
      if (!row.imageUrl)
        await push("achievements", row._id, row.title, row.photo);
    }
    for (const row of await ctx.db.query("teamMembers").collect()) {
      if (!row.imageUrl)
        await push("teamMembers", row._id, row.name, row.image);
    }
    for (const row of await ctx.db.query("gallery").collect()) {
      if (!row.imageUrl) await push("gallery", row._id, row.title, row.photo);
    }

    return pending;
  },
});

/**
 * Used only by `scripts/migrate-to-cloudinary` to repoint a row at its new
 * Cloudinary asset once the file has been copied across. The legacy storage
 * id is left in place so the move can be rolled back; reads prefer the
 * Cloudinary URL from this point on.
 */
export const attachCloudinaryImage = mutation({
  args: {
    table: v.union(
      v.literal("gallery"),
      v.literal("heroSlides"),
      v.literal("collaborators"),
      v.literal("achievements"),
      v.literal("teamMembers")
    ),
    id: v.string(),
    imageUrl: v.string(),
    imagePublicId: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, { table, id, imageUrl, imagePublicId, width, height }) => {
    const docId = ctx.db.normalizeId(table, id);
    if (!docId) throw new Error(`Not a valid ${table} id: ${id}`);

    // Dimensions are only modelled on the gallery table.
    const extra =
      table === "gallery" && width && height ? { width, height } : {};

    await ctx.db.patch(docId, { imageUrl, imagePublicId, ...extra });
  },
});
