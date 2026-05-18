export {
  BANNER_PLACEMENT_LABELS,
  BANNER_PLACEMENTS,
  BANNER_CODE_TEMPLATE,
  BANNER_WIDTH,
  BANNER_HEIGHT,
} from "@/lib/banner-ad";

/** All admin ad slots */
export const AD_PLACEMENT_LABELS: Record<string, string> = {
  banner_home: "Banner 320×50 · Home (top)",
  banner_download: "Banner 320×50 · Download page",
  feed_interval: "Banner 320×50 · Feed (every 3 videos)",
  popup: "Popup · Auto (interval in .env)",
  social_bar: "Social bar · Fullscreen (20s, then every 10 min)",
  popads: "PopAds · Banner strip",
  rewarded_video: "Rewarded video · Earn tokens page",
  video_embed: "Embed · Download page (optional)",
};

export const AD_PLACEMENT_OPTIONS = Object.keys(AD_PLACEMENT_LABELS);

export const AD_TYPE_LABELS: Record<string, string> = {
  banner: "Banner 320×50",
  popup: "Popup",
  embed: "Embed (iframe/HTML)",
  script: "Script / custom HTML",
};

export function placementToAdType(placement: string): "banner" | "popup" | "embed" | "script" {
  if (placement.startsWith("banner_") || placement === "feed_interval") return "banner";
  if (placement === "popup") return "popup";
  if (placement === "video_embed") return "embed";
  if (placement === "rewarded_video") return "script";
  return "script";
}
