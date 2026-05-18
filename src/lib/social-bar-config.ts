/** Social bar fullscreen overlay timing (NEXT_PUBLIC_* in .env.local). */

/** First show after user opens / returns to mini app (seconds). */
export const SOCIAL_BAR_FIRST_DELAY_MS =
  Math.max(0, Number(process.env.NEXT_PUBLIC_SOCIAL_BAR_DELAY_SEC || 20)) * 1000;

/** Repeat every N minutes while app stays open. */
export const SOCIAL_BAR_INTERVAL_MIN = Number(
  process.env.NEXT_PUBLIC_SOCIAL_BAR_INTERVAL_MIN || 10
);

export const SOCIAL_BAR_INTERVAL_MS = Math.max(1, SOCIAL_BAR_INTERVAL_MIN) * 60 * 1000;
