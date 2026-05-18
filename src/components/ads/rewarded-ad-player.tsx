"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRewardedAdBridge } from "@/hooks/use-rewarded-ad-bridge";
import { mountRewardedAd } from "@/lib/mount-rewarded-ad";

const LOAD_TIMEOUT_MS = Number(
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_REWARDED_AD_LOAD_TIMEOUT_MS
    ? process.env.NEXT_PUBLIC_REWARDED_AD_LOAD_TIMEOUT_MS
    : 25000
);

type Props = {
  sessionId: number;
  open: boolean;
  onGranted: () => void;
  onDismissed: () => void;
  onNoFill: () => void;
  onUserClose: () => void;
};

export function RewardedAdPlayer({
  sessionId,
  open,
  onGranted,
  onDismissed,
  onNoFill,
  onUserClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [adCode, setAdCode] = useState<string | null>(null);
  const handledRef = useRef(false);
  const loadTimeoutRef = useRef<number | null>(null);

  const finish = useCallback((fn: () => void) => {
    if (handledRef.current) return;
    handledRef.current = true;
    if (loadTimeoutRef.current != null) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    fn();
  }, []);

  useRewardedAdBridge({
    sessionId: open ? sessionId : null,
    onGranted: () => finish(onGranted),
    onDismissed: () => finish(onDismissed),
    onNoFill: () => finish(onNoFill),
  });

  useEffect(() => {
    if (!open) return;
    handledRef.current = false;
    setLoading(true);
    setAdCode(null);

    fetch("/api/ads?placement=rewarded_video", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const first = d.ads?.[0];
        if (first?.embedCode?.trim()) {
          setAdCode(first.embedCode);
        } else {
          finish(onNoFill);
        }
      })
      .catch(() => finish(onNoFill))
      .finally(() => setLoading(false));
  }, [open, sessionId, finish, onNoFill]);

  useEffect(() => {
    if (!open || !adCode || !containerRef.current) return;

    const cleanup = mountRewardedAd(containerRef.current, adCode, sessionId);

    loadTimeoutRef.current = window.setTimeout(() => {
      finish(onNoFill);
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current != null) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      cleanup();
    };
  }, [open, adCode, sessionId, finish, onNoFill]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between bg-black/90 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium text-white/90">Rewarded ad</p>
        <button
          type="button"
          onClick={onUserClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white"
          aria-label="Close ad"
        >
          ×
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-sm">Loading ad…</p>
          </div>
        ) : adCode ? (
          <div ref={containerRef} className="absolute inset-0" />
        ) : (
          <p className="p-6 text-center text-sm text-white/70">No ad code configured.</p>
        )}
      </div>

      <p className="shrink-0 px-4 py-3 text-center text-xs text-white/70">
        Watch the full ad — close early and you will not earn tokens
      </p>
    </div>
  );
}
