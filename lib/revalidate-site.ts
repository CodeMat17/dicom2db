/**
 * Cache tags the public site rebuilds by. Must match CACHE_TAGS in the public
 * site's lib/server-data.ts — a tag it does not know is rejected there.
 */
export const SITE_TAGS = [
  "achievements",
  "achievements-stats",
  "collaborators",
  "events",
  "gallery",
  "hero-slides",
  "statements",
  "team",
  "testimonials",
] as const;

export type SiteTag = (typeof SITE_TAGS)[number];

/**
 * Tells the public site that one kind of content changed, so the pages that
 * show it rebuild on their next visit instead of waiting out the daily
 * window. Called once after a successful save, with only the tag that save
 * touched — each call costs the public site a rebuild of those pages.
 *
 * Best-effort and fire-and-forget: the record change has already succeeded,
 * and if this fails the page still catches up within a day.
 */
export function revalidateSite(tag: SiteTag) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  }).catch((error) => {
    console.error("Failed to refresh the public site:", error);
  });
}
