// File: /app/api/cloudinary/sign/route.ts
import cloudinary, {
  assertCloudinaryConfigured,
  CLOUDINARY_FOLDER,
  CLOUD_NAME,
} from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

/**
 * Hands the browser a short-lived signature so it can upload straight to
 * Cloudinary without the API secret ever leaving the server.
 */
export async function POST(request: NextRequest) {
  try {
    assertCloudinaryConfigured();

    const { folder } = (await request.json().catch(() => ({}))) as {
      folder?: string;
    };

    const timestamp = Math.round(Date.now() / 1000);
    // Only the parameters signed here may be sent with the upload; adding
    // any other field to the form would make Cloudinary reject it.
    const params = {
      timestamp,
      folder: folder ? `${CLOUDINARY_FOLDER}/${folder}` : CLOUDINARY_FOLDER,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      ...params,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: CLOUD_NAME,
    });
  } catch (error) {
    console.error("Cloudinary signing failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signing failed" },
      { status: 500 }
    );
  }
}
