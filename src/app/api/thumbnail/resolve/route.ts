import { NextResponse } from "next/server";
import { normalizeMediaUrl } from "@/lib/normalize-url";
import { resolveThumbnailUrl } from "@/lib/resolve-thumbnail";

function refererFor(url: string) {
  try {
    return `${new URL(url).origin}/`;
  } catch {
    return "https://www.google.com/";
  }
}

async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) {
        const img = m[1].trim();
        if (img.startsWith("http")) return img;
        if (img.startsWith("//")) return `https:${img}`;
        try {
          return new URL(img, pageUrl).href;
        } catch {
          continue;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/** Resolve thumbnail URL from YouTube, Drive, direct image, or page og:image */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const resolved = resolveThumbnailUrl(raw);
  if (resolved) {
    return NextResponse.json({
      thumbnailUrl: resolved.thumbnailUrl,
      source: resolved.source,
    });
  }

  const pageUrl = normalizeMediaUrl(raw);
  try {
    const u = new URL(pageUrl);
    if (!["http:", "https:"].includes(u.protocol)) {
      return NextResponse.json({ thumbnailUrl: null, source: null });
    }
  } catch {
    return NextResponse.json({ thumbnailUrl: null, source: null });
  }

  const og = await fetchOgImage(pageUrl);
  if (og) {
    return NextResponse.json({ thumbnailUrl: og, source: "og" });
  }

  return NextResponse.json({ thumbnailUrl: null, source: null });
}
