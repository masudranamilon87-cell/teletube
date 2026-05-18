/** Popup auto-show timing (client — use NEXT_PUBLIC_* in .env.local). */

/** Minutes between automatic popup runs while app is open. */
export const POPUP_AD_INTERVAL_MIN = Number(
  process.env.NEXT_PUBLIC_POPUP_AD_INTERVAL_MIN || 5
);

export const POPUP_AD_INTERVAL_MS = Math.max(1, POPUP_AD_INTERVAL_MIN) * 60 * 1000;

/** Delay before the first popup after app loads (seconds). */
export const POPUP_AD_FIRST_DELAY_MS =
  Math.max(0, Number(process.env.NEXT_PUBLIC_POPUP_AD_FIRST_DELAY_SEC || 8)) * 1000;

export const POPUP_LAST_SHOWN_KEY = "teletube_popup_last_shown";

export function canShowPopupNow(): boolean {
  if (typeof localStorage === "undefined") return true;
  const last = Number(localStorage.getItem(POPUP_LAST_SHOWN_KEY) || 0);
  return Date.now() - last >= POPUP_AD_INTERVAL_MS;
}

export function markPopupShown(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(POPUP_LAST_SHOWN_KEY, String(Date.now()));
  }
}
