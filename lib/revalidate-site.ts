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
 * show it rebuild on their next visit. The public site has no timer, so this
 * call is the only way an edit goes live. Called once after a successful
 * save, with only the tag that save touched — each call costs the public site
 * a rebuild of those pages.
 *
 * For `achievements`, pass the slug(s) of the stories the save touched (both
 * the old and new slug when it was renamed). Each story page listens only to
 * its own slug, so a story left out here keeps showing its old version.
 *
 * Best-effort and fire-and-forget: the record change has already succeeded.
 */
export function revalidateSite(tag: SiteTag, ...storySlugs: string[]) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag, storySlugs }),
  }).catch((error) => {
    console.error("Failed to refresh the public site:", error);
  });
}
