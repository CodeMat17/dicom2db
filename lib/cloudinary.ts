import { v2 as cloudinary } from "cloudinary";

/**
 * Server-only Cloudinary client. The API secret never reaches the browser —
 * uploads are signed in `/api/cloudinary/sign` and deletes run through
 * `/api/cloudinary/delete`.
 */
export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Everything the dashboard uploads is namespaced under this folder. */
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "dicom";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function assertCloudinaryConfigured() {
  const missing = [
    ["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", CLOUD_NAME],
    ["CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY],
    ["CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Cloudinary is not configured: missing ${missing.join(", ")}`);
  }
}

export default cloudinary;
