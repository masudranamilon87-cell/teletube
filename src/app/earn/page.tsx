"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RewardedAdPlayer } from "@/components/ads/rewarded-ad-player";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { useAppConfig } from "@/components/providers/app-config-provider";
import { useTelegram } from "@/components/providers/telegram-provider";

type RewardStatus = {
  viewsToday: number;
  dailyLimit: number;
  remaining: number;
  rewardTokens: number;
  canWatch: boolean;
};

export default function EarnPage() {
  const router = useRouter();
  const { ready, authenticated, user, refreshUser } = useTelegram();
  const { maintenanceEnabled, showAds, adsgramRewardBlockId } = useAppConfig();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [lastEarned, setLastEarned] = useState<number | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/rewards/status", { credentials: "include" });
    if (res.status === 401) {
      router.push("/profile");
      return;
    }
    const data = await res.json();
    setStatus(data);
  }, [router]);

  useEffect(() => {
    if (ready && authenticated) loadStatus();
    else if (ready && !authenticated) router.push("/profile");
  }, [ready, authenticated, loadStatus, router]);

  const closePlayer = useCallback(() => {
    setPlayerOpen(false);
    setSessionId(null);
  }, []);

  const claimReward = useCallback(
    async (sid: number) => {
      const res = await fetch("/api/rewards/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: sid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add tokens");
        return false;
      }
      setLastEarned(data.earned);
      setStatus({
        viewsToday: data.viewsToday,
        dailyLimit: status?.dailyLimit ?? 10,
        remaining: data.remaining,
        rewardTokens: status?.rewardTokens ?? 5,
        canWatch: data.remaining > 0,
      });
      await refreshUser();
      setInfo(`+${data.earned} tokens added!`);
      return true;
    },
    [refreshUser, status?.dailyLimit, status?.rewardTokens]
  );

  const playAd = async () => {
    setError("");
    setInfo("");
    setLastEarned(null);
    setStarting(true);

    const res = await fetch("/api/rewards/start", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setStarting(false);

    if (!res.ok) {
      setError(data.error || "Cannot start ad");
      await loadStatus();
      return;
    }

    setSessionId(data.sessionId);
    setStatus(data);
    setPlayerOpen(true);
  };

  const handleGranted = useCallback(async () => {
    if (sessionId == null) return;
    closePlayer();
    const ok = await claimReward(sessionId);
    if (!ok) await loadStatus();
  }, [sessionId, closePlayer, claimReward, loadStatus]);

  const handleDismissed = useCallback(() => {
    closePlayer();
    setError("");
    setInfo("Ad not finished. No tokens added and today's limit was not used.");
  }, [closePlayer]);

  const handleNoFill = useCallback(() => {
    closePlayer();
    setError("");
    setInfo("No ads available right now. Please try again in a few minutes.");
  }, [closePlayer]);

  const handleUserClose = useCallback(() => {
    closePlayer();
    setInfo("You closed the ad early. No tokens added and today's limit was not used.");
  }, [closePlayer]);

  if (!ready || !status) {
    return <div className="h-48 animate-pulse rounded-2xl bg-[var(--tg-secondary)]" />;
  }

  if (maintenanceEnabled && !user?.isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <>
      <div className="space-y-4 pb-6">
        <div>
          <Link href="/" className="text-sm text-[var(--tg-link)]">
            ← Home
          </Link>
          <h1 className="mt-2 text-lg font-bold">Earn tokens</h1>
          <p className="text-sm text-[var(--tg-hint)]">
            Watch the full ad to earn tokens
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--tg-hint)]/15 bg-[var(--tg-secondary)]/40 p-4 text-center">
          <p className="text-2xl font-bold">🪙 +{status.rewardTokens}</p>
          <p className="mt-1 text-sm text-[var(--tg-hint)]">per completed rewarded ad</p>
          <p className="mt-3 text-sm">
            Today: <strong>{status.viewsToday}</strong> / {status.dailyLimit} completed
          </p>
          <p className="text-xs text-[var(--tg-hint)]">
            {status.remaining} remaining · only completed ads count
          </p>
        </div>

        <button
          type="button"
          disabled={!status.canWatch || starting || playerOpen}
          onClick={playAd}
          className="w-full rounded-2xl bg-[var(--tg-button)] py-4 text-base font-semibold text-[var(--tg-button-text)] disabled:opacity-50"
        >
          {starting
            ? "Starting…"
            : status.canWatch
              ? "▶ Play ad & earn tokens"
              : "Daily limit reached — come back tomorrow"}
        </button>

        {lastEarned && status.canWatch ? (
          <button
            type="button"
            onClick={playAd}
            disabled={starting || playerOpen}
            className="w-full rounded-2xl border border-[var(--tg-link)] py-3 text-sm font-medium text-[var(--tg-link)]"
          >
            Watch another ad
          </button>
        ) : null}

        {info ? (
          <p className="rounded-xl bg-[var(--tg-secondary)]/50 p-3 text-center text-sm text-[var(--tg-link)]">
            {info}
          </p>
        ) : null}

        {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}

        <div className="rounded-xl bg-[var(--tg-secondary)]/40 p-4 text-sm leading-relaxed text-[var(--tg-hint)]">
          <p className="font-semibold text-[var(--tg-text)]">How to earn tokens</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>
              Tap <strong className="text-[var(--tg-text)]">Play ad & earn tokens</strong>
            </li>
            <li>Watch the full ad — closing early earns nothing</li>
            <li>
              Up to <strong>{status.dailyLimit}</strong> completed ads count per day
            </li>
            <li>If no ad loads, try again in a few minutes</li>
          </ul>
        </div>
      </div>

      {showAds && sessionId != null ? (
        <RewardedAdPlayer
          sessionId={sessionId}
          open={playerOpen}
          adsgramBlockId={adsgramRewardBlockId}
          onGranted={() => void handleGranted()}
          onDismissed={handleDismissed}
          onNoFill={handleNoFill}
          onUserClose={handleUserClose}
        />
      ) : null}
    </>
  );
}
