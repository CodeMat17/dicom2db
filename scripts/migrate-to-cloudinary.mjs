// scripts/migrate-to-cloudinary.mjs
//
// One-off move of every image still held in Convex storage over to
// Cloudinary. Safe to re-run: rows that already carry a Cloudinary URL are
// skipped, and the legacy storage id is left in place so nothing is lost.
//
//   node scripts/migrate-to-cloudinary.mjs           # do it
//   node scripts/migrate-to-cloudinary.mjs --dry-run # just list the work
//
// Requires NEXT_PUBLIC_CONVEX_URL plus the three CLOUDINARY_* variables in
// .env.local.

import { v2 as cloudinary } from "cloudinary";
import { ConvexHttpClient } from "convex/browser";
import fs from "node:fs";
import path from "node:path";

// Minimal .env.local reader so the script needs no extra dependency.
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const {
  NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER = "dicom",
} = process.env;

const missing = Object.entries({
  NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
})
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const dryRun = process.argv.includes("--dry-run");
const convex = new ConvexHttpClient(NEXT_PUBLIC_CONVEX_URL);

/** Convex folders map one-to-one onto Cloudinary sub-folders. */
const FOLDERS = {
  heroSlides: "hero",
  collaborators: "collaborators",
  achievements: "stories",
  teamMembers: "staff",
  gallery: "gallery",
};

const pending = await convex.query("gallery:listLegacyImages", {});

if (pending.length === 0) {
  console.log("Nothing to migrate — every row already points at Cloudinary.");
  process.exit(0);
}

console.log(`${pending.length} image(s) to migrate:`);
for (const row of pending) {
  console.log(`  ${row.table} · ${row.label}`);
}

if (dryRun) {
  console.log("\nDry run — nothing was uploaded.");
  process.exit(0);
}

let migrated = 0;
let failed = 0;

for (const row of pending) {
  if (!row.url) {
    console.warn(`! ${row.table} · ${row.label}: no downloadable file, skipped`);
    failed += 1;
    continue;
  }

  try {
    // Cloudinary fetches the Convex URL directly, so nothing is buffered here.
    const uploaded = await cloudinary.uploader.upload(row.url, {
      folder: `${CLOUDINARY_FOLDER}/${FOLDERS[row.table] ?? "misc"}`,
    });

    await convex.mutation("gallery:attachCloudinaryImage", {
      table: row.table,
      id: row.id,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });

    migrated += 1;
    console.log(`✓ ${row.table} · ${row.label}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${row.table} · ${row.label}:`, error.message ?? error);
  }
}

console.log(`\nDone. ${migrated} migrated, ${failed} failed.`);
process.exit(failed ? 1 : 0);
