/** IAB / mobile standard leaderboard banner (used by Propeller, Adsterra, etc.) */
export const BANNER_WIDTH = 320;
export const BANNER_HEIGHT = 50;

export const BANNER_PLACEMENTS = [
  "banner_home",
  "banner_download",
  "feed_interval",
] as const;

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  banner_home: "Banner 320×50 · Home (top)",
  banner_download: "Banner 320×50 · Download page (top)",
  feed_interval: "Banner 320×50 · Feed (every 3 videos)",
};

/** Example code for admin — atOptions iframe 320×50 */
export const BANNER_CODE_TEMPLATE = `<script>
  atOptions = {
    'key' : 'YOUR_AD_KEY',
    'format' : 'iframe',
    'height' : ${BANNER_HEIGHT},
    'width' : ${BANNER_WIDTH},
    'params' : {}
  };
</script>
<script src="https://YOUR_NETWORK.com/YOUR_KEY/invoke.js"></script>`;

/** Force width/height in common ad-network snippets */
export function normalizeBannerCode(code: string): string {
  let out = code.trim();
  if (!out) return out;

  if (/atOptions/i.test(out)) {
    if (/['"]width['"]/i.test(out)) {
      out = out.replace(/(['"])width\1\s*:\s*\d+/gi, `'width' : ${BANNER_WIDTH}`);
    }
    if (/['"]height['"]/i.test(out)) {
      out = out.replace(/(['"])height\1\s*:\s*\d+/gi, `'height' : ${BANNER_HEIGHT}`);
    }
  }

  return out;
}
