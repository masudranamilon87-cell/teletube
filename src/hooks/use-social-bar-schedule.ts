"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  SOCIAL_BAR_FIRST_DELAY_MS,
  SOCIAL_BAR_INTERVAL_MS,
} from "@/lib/social-bar-config";

/** Mini app left foreground for this long → new visit (20s + 10min cycle restarts). */
const HIDDEN_RESET_MS = 3000;

type Options = {
  enabled: boolean;
  onFire: () => void | Promise<void>;
  isBlocked: () => boolean;
};

/**
 * Schedules social bar: first fire after 20s, then every 10 min.
 * Restarts cycle only when user actually leaves mini app (hidden ≥ 3s).
 */
export function useSocialBarSchedule({ enabled, onFire, isBlocked }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const visitRef = useRef(0);
  const onFireRef = useRef(onFire);
  const isBlockedRef = useRef(isBlocked);

  onFireRef.current = onFire;
  isBlockedRef.current = isBlocked;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (delayMs: number) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void (async () => {
          if (isBlockedRef.current()) {
            schedule(SOCIAL_BAR_INTERVAL_MS);
            return;
          }
          await onFireRef.current();
          schedule(SOCIAL_BAR_INTERVAL_MS);
        })();
      }, delayMs);
    },
    [clearTimer]
  );

  const startVisit = useCallback(() => {
    visitRef.current += 1;
    clearTimer();
    schedule(SOCIAL_BAR_FIRST_DELAY_MS);
  }, [clearTimer, schedule]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    startVisit();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;

      if (Date.now() - hiddenAt >= HIDDEN_RESET_MS) {
        startVisit();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, startVisit, schedule, clearTimer]);

  return { startVisit, clearTimer };
}
