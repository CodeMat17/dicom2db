import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getHeroSlides = query({
  handler: async (ctx) => {
    const slides = await ctx.db.query("heroSlides").collect();

    const slidesWithUrls = await Promise.all(
      slides.map(async (slide) => {
        // Cloudinary first; fall back to the legacy Convex file for rows the
        // migration has not copied across yet.
        const imgUrl =
          slide.imageUrl ??
          (slide.img ? await ctx.storage.getUrl(slide.img) : null);

        return {
          _id: slide._id,
          title: slide.title,
          subtitle: slide.subtitle,
          alt: slide.title,
          img: slide.img,
          imagePublicId: slide.imagePublicId,
          imgUrl,
        };
      })
    );
    return slidesWithUrls;
  },
});

export const addHeroSlide = mutation({
  args: {
    imageUrl: v.string(),
    imagePublicId: v.string(),
    title: v.string(),
    subtitle: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("heroSlides", {
      imageUrl: args.imageUrl,
      imagePublicId: args.imagePublicId,
      title: args.title,
      subtitle: args.subtitle,
      alt: args.title,
    });
  },
});

export const updateHeroSlide = mutation({
  args: {
    id: v.id("heroSlides"),
    title: v.string(),
    subtitle: v.string(),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Hero slide not found");

    const replacing = !!args.imageUrl && args.imageUrl !== existing.imageUrl;

    // A replaced legacy file can go now; the Cloudinary asset is purged by
    // the caller, which is the only side holding the API secret.
    if (replacing && existing.img) {
      await ctx.storage.delete(existing.img).catch((error) => {
        console.error("Failed to delete legacy hero image:", error);
      });
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      subtitle: args.subtitle,
      alt: args.title,
      ...(replacing
        ? {
            imageUrl: args.imageUrl,
            imagePublicId: args.imagePublicId,
            img: undefined,
          }
        : {}),
    });

    // So the dashboard can purge the asset this row no longer points at.
    return {
      replacedPublicId: replacing ? (existing.imagePublicId ?? null) : null,
    };
  },
});

export const deleteHeroSlide = mutation({
  args: {
    id: v.id("heroSlides"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Hero slide not found");

    if (existing.img) {
      await ctx.storage.delete(existing.img).catch((error) => {
        console.error("Failed to delete legacy hero image:", error);
      });
    }

    await ctx.db.delete(args.id);
    return { deletedPublicId: existing.imagePublicId ?? null };
  },
});
