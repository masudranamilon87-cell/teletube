import { normalizeMediaUrl } from "@/lib/normalize-url";

export type ThumbnailSource = "direct" | "youtube" | "drive";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)(\?|$)/i;

export function extractYouTubeVideoId(url: string): string | null {
  const normalized = normalizeMediaUrl(url);
  try {
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length >= 6 ? id : null;
    }

    if (host.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v && v.length >= 6 ? v : null;
      }
      const embed = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
      const live = u.pathname.match(/^\/live\/([^/?]+)/);
      if (live) return live[1];
    }
  } catch {
    // invalid URL
  }
  return null;
}

export function extractGoogleDriveFileId(url: string): string | null {
  const normalized = normalizeMediaUrl(url);
  try {
    const u = new URL(normalized);
    const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1];
    const id = u.searchParams.get("id");
    if (id && u.hostname.includes("drive.google.com")) return id;
  } catch {
    // invalid URL
  }
  return null;
}

function isDirectImageUrl(url: string): boolean {
  const path = url.split("?")[0];
  if (IMAGE_EXT.test(path)) return true;
  return /img\.youtube\.com|i\.ytimg\.com|googleusercontent\.com|drive\.google\.com\/thumbnail/i.test(
    url
  );
}

export function youtubeThumbnailUrl(
  videoId: string,
  quality: "max" | "hq" = "max"
): string {
  const file = quality === "max" ? "maxresdefault" : "hqdefault";
  return `https://img.youtube.com/vi/${videoId}/${file}.jpg`;
}

export function driveThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

/** Resolve a pasted link to a displayable thumbnail URL (YouTube, Drive, or direct image). */
export function resolveThumbnailUrl(
  input: string
): { thumbnailUrl: string; source: ThumbnailSource } | null {
  const raw = input.trim();
  if (!raw) return null;

  const url = normalizeMediaUrl(raw);

  if (isDirectImageUrl(url)) {
    return { thumbnailUrl: url, source: "direct" };
  }

  const ytId = extractYouTubeVideoId(url);
  if (ytId) {
    return { thumbnailUrl: youtubeThumbnailUrl(ytId), source: "youtube" };
  }

  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    return { thumbnailUrl: driveThumbnailUrl(driveId), source: "drive" };
  }

  return null;
}
