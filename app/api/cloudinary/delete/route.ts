// File: /app/api/cloudinary/delete/route.ts
import cloudinary, { assertCloudinaryConfigured } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

/**
 * Removes an asset from Cloudinary. Called by the dashboard right after the
 * matching Convex record is deleted or its image replaced, so the media
 * library does not fill up with orphans.
 */
export async function POST(request: NextRequest) {
  try {
    assertCloudinaryConfigured();

    const { publicId } = (await request.json()) as { publicId?: string };
    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    return NextResponse.json({ result: result.result });
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
