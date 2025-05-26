// File: /app/api/storage/upload-url/route.ts

import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
  try {
    const uploadUrl = await convex.mutation(api.storage.generateUploadUrl, {});
    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error("Upload URL generation failed:", error);
    return new NextResponse("Failed to generate upload URL", { status: 500 });
  }
}
