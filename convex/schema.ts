import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  heroSlides: defineTable({
    img: v.id("_storage"),
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
    logo: v.id("_storage"),
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
    photo: v.id("_storage"),
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

  teamMembers: defineTable({
    name: v.string(),
    position: v.string(),
    email: v.optional(v.string()),
    profile: v.optional(v.string()),
    image: v.id("_storage"),
    role: v.union(v.literal("director"), v.literal("staff")),
  }).index("by_role", ["role"]),
});
