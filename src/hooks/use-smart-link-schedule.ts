"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  SMART_LINK_FIRST_DELAY_MS,
  SMART_LINK_INTERVAL_MS,
} from "@/lib/smart-link-config";

const HIDDEN_RESET_MS = 3000;

type Options = {
  enabled: boolean;
  onFire: () => void | Promise<void>;
  isBlocked: () => boolean;
};

/** First show 30s after visit, then every 5 min; restarts after leaving mini app 3s+. */
export function useSmartLinkSchedule({ enabled, onFire, isBlocked }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
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
            schedule(SMART_LINK_INTERVAL_MS);
            return;
          }
          await onFireRef.current();
          schedule(SMART_LINK_INTERVAL_MS);
        })();
      }, delayMs);
    },
    [clearTimer]
  );

  const startVisit = useCallback(() => {
    clearTimer();
    schedule(SMART_LINK_FIRST_DELAY_MS);
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
      if (hiddenAt != null && Date.now() - hiddenAt >= HIDDEN_RESET_MS) {
        startVisit();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, startVisit, clearTimer]);

  return { startVisit };
}
