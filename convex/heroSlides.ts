import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getHeroSlides = query({
  handler: async (ctx) => {
    const slides = await ctx.db.query("heroSlides").collect();

    const slidesWithUrls = await Promise.all(
      slides.map(async (slide) => {
        const imgUrl = slide.img ? await ctx.storage.getUrl(slide.img) : null;

        return {
          _id: slide._id,
          title: slide.title,
          subtitle: slide.subtitle,
          alt: slide.title,
          img: slide.img,
          imgUrl,
        };
      })
    );
    return slidesWithUrls;
  },
});

export const addHeroSlide = mutation({
  args: {
    img: v.id("_storage"),
    title: v.string(),
    subtitle: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("heroSlides", {
      img: args.img,
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
    img: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Hero slide not found");

    // Delete old image if a new one is being used and it differs from current
    if (args.img && args.img !== existing.img) {
      await ctx.storage.delete(existing.img);
    }

    await ctx.db.patch(args.id, {
      title: args.title ?? existing.title,
      subtitle: args.subtitle ?? existing.subtitle,
      img: args.img ?? existing.img,
      alt: args.title ?? existing.title,
    });
  },
});

export const deleteHeroSlide = mutation({
  args: {
    id: v.id("heroSlides"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
