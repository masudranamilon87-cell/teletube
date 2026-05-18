import { getSiteUrl } from "@/lib/telegram/site-url";
import { normalizeMediaUrl } from "@/lib/normalize-url";

/** In-app page opened from channel button (web_app). */
export function miniAppVideoUrl(videoId: number): string {
  const base = getSiteUrl();
  if (!base) throw new Error("Set NEXT_PUBLIC_SITE_URL to your HTTPS domain");
  return `${base}/download/${videoId}`;
}

/** t.me link — optional share; opens mini app with start_param. */
export function telegramStartAppLink(videoId: number): string | null {
  const bot = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  const app = process.env.TELEGRAM_MINI_APP_SHORT_NAME?.trim();
  if (!bot || !app) return null;
  return `https://t.me/${bot}/${app}?startapp=video_${videoId}`;
}

export function publicThumbnailForTelegram(thumbnailUrl: string): string {
  const base = getSiteUrl();
  const direct = normalizeMediaUrl(thumbnailUrl);
  if (!base) return direct;
  return `${base}/api/thumbnail?url=${encodeURIComponent(direct)}`;
}

export function parseVideoIdFromStartParam(
  param: string | undefined | null
): number | null {
  if (!param?.trim()) return null;
  const raw = param.trim();
  const prefixed = raw.match(/^video_(\d+)$/i);
  if (prefixed) return Number(prefixed[1]);
  if (/^\d+$/.test(raw)) return Number(raw);
  return null;
}
