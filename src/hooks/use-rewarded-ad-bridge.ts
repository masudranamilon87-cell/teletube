"use client";

import { useEffect, useRef } from "react";
import { isRewardedAdMessage, REWARDED_MESSAGE_TYPE } from "@/lib/rewarded-ad-bridge";

type Handlers = {
  sessionId: number | null;
  onGranted: () => void;
  onDismissed: () => void;
  onNoFill: () => void;
};

/** Listen for provider callbacks (postMessage + window.TeleTubeRewardedAds). */
export function useRewardedAdBridge({
  sessionId,
  onGranted,
  onDismissed,
  onNoFill,
}: Handlers) {
  const handlersRef = useRef({ onGranted, onDismissed, onNoFill });
  handlersRef.current = { onGranted, onDismissed, onNoFill };

  useEffect(() => {
    if (sessionId == null) return;

    const dispatch = (event: "granted" | "dismissed" | "no_fill") => {
      if (event === "granted") handlersRef.current.onGranted();
      else if (event === "dismissed") handlersRef.current.onDismissed();
      else handlersRef.current.onNoFill();
    };

    const bridge = {
      grant: () => dispatch("granted"),
      dismiss: () => dispatch("dismissed"),
      noFill: () => dispatch("no_fill"),
    };

    (window as Window & { TeleTubeRewardedAds?: typeof bridge }).TeleTubeRewardedAds =
      bridge;

    const onMessage = (e: MessageEvent) => {
      if (!isRewardedAdMessage(e.data)) return;
      if (e.data.sessionId !== sessionId) return;
      dispatch(e.data.event);
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      const w = window as Window & { TeleTubeRewardedAds?: typeof bridge };
      if (w.TeleTubeRewardedAds === bridge) delete w.TeleTubeRewardedAds;
    };
  }, [sessionId]);
}

export { REWARDED_MESSAGE_TYPE };
