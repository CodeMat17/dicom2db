import { SITE_TAGS, type SiteTag } from "@/lib/revalidate-site";
import { NextRequest, NextResponse } from "next/server";

/**
 * Forwards a refresh request to the public site's /api/revalidate, so the
 * shared secret never leaves the server. Only one known tag is passed on per
 * save, plus one `achievement:<slug>` tag for each story page the save
 * touched.
 */
export async function POST(request: NextRequest) {
  const siteUrl = process.env.PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) {
    return NextResponse.json(
      { error: "PUBLIC_SITE_URL and REVALIDATE_SECRET must be set" },
      { status: 501 }
    );
  }

  const { tag, storySlugs } = (await request.json().catch(() => ({}))) as {
    tag?: string;
    storySlugs?: unknown;
  };
  if (!tag || !SITE_TAGS.includes(tag as SiteTag)) {
    return NextResponse.json({ error: "Unknown tag" }, { status: 400 });
  }

  const slugs = Array.isArray(storySlugs)
    ? storySlugs.filter((slug): slug is string => typeof slug === "string" && !!slug)
    : [];

  try {
    const url = new URL("/api/revalidate", siteUrl);
    url.searchParams.append("tag", tag);
    for (const slug of new Set(slugs)) {
      url.searchParams.append("tag", `achievement:${slug}`);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);

    return NextResponse.json(body, { status: res.status });
  } catch (error) {
    console.error("Public site revalidation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Revalidation failed" },
      { status: 502 }
    );
  }
}
