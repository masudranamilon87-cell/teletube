import type { AdsgramShowResult } from "@/types/adsgram";

const SCRIPT_URL = "https://sad.adsgram.ai/js/sad.min.js";

let scriptPromise: Promise<void> | null = null;

export type AdsgramRewardOutcome = "granted" | "dismissed" | "no_fill";

function loadAdsgramScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("AdsGram runs in browser only"));
  }
  if (window.Adsgram) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_URL}"]`
      );
      if (existing) {
        if (window.Adsgram) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("AdsGram script failed to load"))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("AdsGram script failed to load"));
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

function outcomeFromResult(result: AdsgramShowResult): AdsgramRewardOutcome {
  if (result.error) return "no_fill";
  if (result.done) return "granted";
  return "dismissed";
}

/** Show AdsGram rewarded ad for the given block ID (from admin settings). */
export async function showAdsgramReward(blockId: string): Promise<AdsgramRewardOutcome> {
  const id = blockId.trim();
  if (!id) return "no_fill";

  await loadAdsgramScript();
  if (!window.Adsgram) return "no_fill";

  const controller = window.Adsgram.init({ blockId: id });

  try {
    const result = await controller.show();
    return outcomeFromResult(result);
  } catch (result) {
    if (result && typeof result === "object" && "error" in result) {
      return outcomeFromResult(result as AdsgramShowResult);
    }
    return "no_fill";
  }
}
