// convex/gallery.ts
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

/**
 * Gallery posts. A post carries a set of photographs; the files live in
 * Cloudinary and Convex holds the title, description, dimensions and
 * published date. Rows still pointing at a Convex file are resolved through
 * storage until the migration script copies them.
 *
 * The published date is derived rather than entered: `publishedAt` when set,
 * otherwise the row's creation time.
 */
export type GalleryImage = {
  url: string;
  publicId: string | null;
  width?: number;
  height?: number;
};

/**
 * The post's photos, newest schema first. Rows written before galleries went
 * multi-image carry a single Cloudinary URL — or, older still, a Convex file —
 * and are surfaced here as a one-entry list so every reader sees one shape.
 */
const resolveImages = async (
  ctx: QueryCtx,
  photo: Doc<"gallery">
): Promise<GalleryImage[]> => {
  if (photo.images?.length) {
    return photo.images.map((image) => ({
      url: image.url,
      publicId: image.publicId,
      width: image.width,
      height: image.height,
    }));
  }

  const legacyUrl =
    photo.imageUrl ??
    (photo.photo ? await ctx.storage.getUrl(photo.photo) : null);
  if (!legacyUrl) return [];

  return [
    {
      url: legacyUrl,
      publicId: photo.imagePublicId ?? null,
      width: photo.width,
      height: photo.height,
    },
  ];
};

/** Every Cloudinary asset a row owns, for cleanup after a delete or replace. */
const publicIdsOf = (photo: Doc<"gallery">) =>
  (photo.images?.length
    ? photo.images.map((image) => image.publicId)
    : [photo.imagePublicId]
  ).filter((id): id is string => !!id);

const imageValidator = v.object({
  url: v.string(),
  publicId: v.string(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
});

export const getAllPhotos = query({
  handler: async (ctx) => {
    const photos = await ctx.db.query("gallery").order("desc").collect();

    const withUrls = await Promise.all(
      photos.map(async (photo) => {
        const images = await resolveImages(ctx, photo);
        return {
          _id: photo._id,
          title: photo.title,
          description: photo.description,
          category: photo.category,
          images,
          publishedAt: photo.publishedAt ?? photo._creationTime,
          // The first photo stands for the post wherever only one can be
          // shown — cards, previews, and readers written before the set.
          photoUrl: images[0]?.url ?? null,
          width: images[0]?.width,
          height: images[0]?.height,
          imagePublicId: images[0]?.publicId ?? undefined,
        };
      })
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
      photos.map(async (photo) => {
        const images = await resolveImages(ctx, photo);
        return {
          _id: photo._id,
          title: photo.title,
          description: photo.description,
          images,
          publishedAt: photo.publishedAt ?? photo._creationTime,
          photoUrl: images[0]?.url ?? null,
          width: images[0]?.width,
          height: images[0]?.height,
        };
      })
    );
  },
});

/**
 * Cursor-paginated feed for the public site's gallery wall, newest first.
 *
 * It lives here because this dashboard and the public site both deploy their
 * `convex/` folder to the same deployment — whichever pushed last defines the
 * API — so the public site's read-only queries have to exist here too.
 *
 * Ordering is the table's own `_creationTime` descending rather than the
 * derived `publishedAt` that `getAllPhotos` sorts by: a cursor can only walk
 * an order the database itself maintains, and sorting in JS would only ever
 * reorder within a page.
 */
export const getPhotosPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const page = await ctx.db
      .query("gallery")
      .order("desc")
      .paginate(paginationOpts);

    return {
      ...page,
      page: await Promise.all(
        page.page.map(async (photo) => {
          const images = await resolveImages(ctx, photo);
          return {
            _id: photo._id,
            title: photo.title,
            description: photo.description,
            category: photo.category,
            images,
            publishedAt: photo.publishedAt ?? photo._creationTime,
            photoUrl: images[0]?.url ?? null,
            width: images[0]?.width,
            height: images[0]?.height,
          };
        })
      ),
    };
  },
});

export const addPhoto = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    images: v.array(imageValidator),
    category: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim() || args.images.length === 0) {
      throw new Error("Title and at least one photo are required");
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
    // The complete set the post should end up with — additions, removals and
    // reordering all arrive as one list. Omitted leaves the photos untouched.
    images: v.optional(v.array(imageValidator)),
  },
  handler: async (ctx, { id, images, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Photo not found");

    if (images && images.length === 0) {
      throw new Error("A post needs at least one photo");
    }

    // Assets the new set no longer references are handed back for cleanup.
    const kept = new Set(images?.map((image) => image.publicId) ?? []);
    const orphaned = images
      ? publicIdsOf(existing).filter((publicId) => !kept.has(publicId))
      : [];

    if (images && existing.photo) {
      await ctx.storage.delete(existing.photo).catch((error) => {
        console.error("Failed to delete legacy photo:", error);
      });
    }

    await ctx.db.patch(id, {
      ...fields,
      title: fields.title.trim(),
      description: fields.description.trim(),
      category: fields.category?.trim() || undefined,
      ...(images
        ? {
            images,
            // Once a row is written in the new shape the single-image
            // columns are retired for it.
            imageUrl: undefined,
            imagePublicId: undefined,
            width: undefined,
            height: undefined,
            photo: undefined,
          }
        : {}),
    });

    return { replacedPublicIds: orphaned };
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

    const deletedPublicIds = publicIdsOf(photo);
    await ctx.db.delete(id);
    return { success: true, deletedPublicIds };
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
      if (!row.images?.length && !row.imageUrl)
        await push("gallery", row._id, row.title, row.photo);
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
  handler: async (
    ctx,
    { table, id, imageUrl, imagePublicId, width, height }
  ) => {
    const docId = ctx.db.normalizeId(table, id);
    if (!docId) throw new Error(`Not a valid ${table} id: ${id}`);

    // Dimensions are only modelled on the gallery table.
    const extra =
      table === "gallery" && width && height ? { width, height } : {};

    await ctx.db.patch(docId, { imageUrl, imagePublicId, ...extra });
  },
});

/**
 * Title search for the public gallery wall.
 *
 * The wall itself is cursor-paginated, but a search has to reach posts that
 * have not been fetched yet, so this walks the table instead of the loaded
 * pages. Matching is on the title only — that is what the public search box
 * promises — and every whitespace-separated term in the query must appear
 * somewhere in it, so "award 2024" narrows rather than widens.
 *
 * The result is capped: a one- or two-letter query would otherwise return the
 * whole table, and nobody scrolls past the first screen of matches anyway.
 */
export const searchPhotos = query({
  args: { term: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { term, limit = 30 }) => {
    const terms = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    const photos = await ctx.db.query("gallery").order("desc").collect();

    const matches = photos.filter((photo) => {
      const title = photo.title.toLowerCase();
      return terms.every((word) => title.includes(word));
    });

    const withUrls = await Promise.all(
      matches.map(async (photo) => {
        const images = await resolveImages(ctx, photo);
        return {
          _id: photo._id,
          title: photo.title,
          description: photo.description,
          category: photo.category,
          images,
          publishedAt: photo.publishedAt ?? photo._creationTime,
          photoUrl: images[0]?.url ?? null,
          width: images[0]?.width,
          height: images[0]?.height,
        };
      })
    );

    return withUrls
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);
  },
});
