import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export interface Staff {
  _id: Id<"teamMembers">;
  name: string;
  position: string;
  image: Id<"_storage">; // image is the storageId
  imageUrl?: string | null; // optional field after resolving
  email?: string;
  profile?: string;
  role: "director" | "staff";
}

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

    const resolveImageUrl = async (member: Staff) => ({
      ...member,
      imageUrl: member.image ? await ctx.storage.getUrl(member.image) : null,
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
    image: v.id("_storage"),
    profile: v.string(), // Now accepts text content
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
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Staff member not found");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      position: args.position,
      email: args.email,
      profile: args.profile,
      ...(args.image && { image: args.image }),
    });
  },
});

export const deleteStaff = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Staff member not found");
    }

    await ctx.db.delete(args.id);
  },
});