import { z } from "zod";
import { normalizeMediaUrl } from "@/lib/normalize-url";

export const flexUrl = z
  .string()
  .min(1, "URL required")
  .transform((s) => normalizeMediaUrl(s));

export const videoBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnailUrl: flexUrl,
  videoUrl: flexUrl,
  videoType: z
    .enum(["mp4", "mkv", "zip", "youtube", "drive", "link", "other"])
    .optional()
    .default("link"),
  durationSec: z
    .union([z.number().int().positive(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  tokenCost: z.number().int().min(0).default(0),
  isLocked: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const adBodySchema = z
  .object({
    name: z.string().min(1),
    placement: z.enum([
      "banner_home",
      "banner_download",
      "feed_interval",
      "popup",
      "video_embed",
      "social_bar",
      "popads",
      "rewarded_video",
    ]),
    adType: z.enum(["banner", "popup", "embed", "script"]).default("banner"),
    embedCode: z.string().default(""),
    smartLink: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .transform((data) => {
    const embedCode = data.embedCode.trim();
    const smartLink = data.smartLink?.trim() || null;
    const hasContent = embedCode.length > 0 || Boolean(smartLink);
    return {
      ...data,
      embedCode,
      smartLink,
      isActive: data.isActive && hasContent,
    };
  });

const optionalHttpUrl = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    const t = v?.trim();
    if (!t) return null;
    if (!/^https?:\/\/.+/i.test(t)) return null;
    return t;
  });

export const smartScreenBodySchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  emoji: z.string().min(1).default("🔥"),
  mediaUrl: optionalHttpUrl,
  smartLink: z.string().url("Valid smart link URL required"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
