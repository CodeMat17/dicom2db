"use client";

/** What every upload hands back to the form that triggered it. */
export type UploadedImage = {
  imageUrl: string;
  imagePublicId: string;
  width: number;
  height: number;
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Uploads a file straight from the browser to Cloudinary, signed by our own
 * API route. Cloudinary reports the stored dimensions back, which is what
 * lets the public site lay portraits and landscapes out correctly.
 *
 * @param folder Sub-folder under the account's DICOM folder, e.g. "gallery".
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string
): Promise<UploadedImage> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be less than 10MB");
  }

  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!signRes.ok) {
    const { error } = await signRes.json().catch(() => ({ error: "" }));
    throw new Error(error || "Could not start the upload");
  }

  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } =
    await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  // Must match the signed parameters exactly or Cloudinary rejects the upload.
  form.append("folder", signedFolder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!uploadRes.ok) {
    const body = await uploadRes.json().catch(() => null);
    throw new Error(body?.error?.message || "Upload to Cloudinary failed");
  }

  const result = await uploadRes.json();

  return {
    imageUrl: result.secure_url as string,
    imagePublicId: result.public_id as string,
    width: result.width as number,
    height: result.height as number,
  };
}

/**
 * Best-effort removal of an orphaned asset. Never throws: the record change
 * has already succeeded by the time this runs, and a stray file in the media
 * library is not worth failing the user's action over.
 */
export async function deleteFromCloudinary(publicId?: string | null) {
  if (!publicId) return;
  try {
    await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error);
  }
}

/**
 * Same best-effort removal for a whole set, used when a gallery post is
 * deleted or has photos taken out of it.
 */
export async function deleteManyFromCloudinary(
  publicIds?: (string | null | undefined)[] | null
) {
  if (!publicIds?.length) return;
  await Promise.all(publicIds.map((publicId) => deleteFromCloudinary(publicId)));
}
