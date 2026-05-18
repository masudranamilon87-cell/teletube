/** Smart link fullscreen rotation (NEXT_PUBLIC_* in .env.local). */

export const SMART_LINK_FIRST_DELAY_MS =
  Math.max(0, Number(process.env.NEXT_PUBLIC_SMART_LINK_DELAY_SEC || 30)) * 1000;

export const SMART_LINK_INTERVAL_MIN = Number(
  process.env.NEXT_PUBLIC_SMART_LINK_INTERVAL_MIN || 5
);

export const SMART_LINK_INTERVAL_MS = Math.max(1, SMART_LINK_INTERVAL_MIN) * 60 * 1000;
