import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Images live in Cloudinary; Convex holds everything else.
 *
 * Every image-bearing table carries `imageUrl` (the Cloudinary secure URL the
 * site renders) and `imagePublicId` (what the dashboard needs to delete or
 * replace the asset). The original `_storage` id is kept optional so rows
 * uploaded before the move keep working until `scripts/migrate-to-cloudinary`
 * has copied them across — once it has, the legacy field can be dropped.
 */
export default defineSchema({
  heroSlides: defineTable({
    img: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    alt: v.string(),
    title: v.string(),
    subtitle: v.string(),
  }),

  events: defineTable({
    title: v.string(),
    date: v.optional(v.string()),
    location: v.optional(v.string()),
    note: v.optional(v.string()),
  }),

  collaborators: defineTable({
    logo: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    name: v.string(),
    office: v.string(),
  }),

  statements: defineTable({
    type: v.union(
      v.literal("mission"),
      v.literal("vision"),
      v.literal("core-values")
    ),
    title: v.string(),
    content: v.optional(v.string()),
    values: v.optional(v.array(v.string())),
  }),

  achievements: defineTable({
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    story: v.optional(v.string()),
    photo: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  }).index("by_slug", ["slug"]),

  achievementsStats: defineTable({
    nationalChampions: v.number(),
    internationalRecognition: v.number(),
    studentWinners: v.number(),
    universityAwards: v.number(),
  }),

  testimonials: defineTable({
    name: v.string(),
    body: v.string(),
    role: v.string(),
  }),

  gallery: defineTable({
    title: v.string(),
    description: v.string(),
    photo: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    // Cloudinary reports these on upload, so the public grid can reserve the
    // right box and lay portraits and landscapes out without measuring first.
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    category: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  }),

  teamMembers: defineTable({
    name: v.string(),
    position: v.string(),
    email: v.optional(v.string()),
    profile: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imagePublicId: v.optional(v.string()),
    role: v.union(v.literal("director"), v.literal("staff")),
  }).index("by_role", ["role"]),
});
