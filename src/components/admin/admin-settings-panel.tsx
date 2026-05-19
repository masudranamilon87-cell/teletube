"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppConfig } from "@/components/providers/app-config-provider";

export function AdminSettingsPanel() {
  const { refreshConfig } = useAppConfig();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [adsgramBlockId, setAdsgramBlockId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingAdsgram, setSavingAdsgram] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setMaintenanceEnabled(Boolean(d.maintenanceEnabled));
        setAdsgramBlockId(String(d.adsgramRewardBlockId || ""));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveMaintenance = async (enabled: boolean) => {
    setSavingMaintenance(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ maintenanceEnabled: enabled }),
    });
    const data = await res.json();
    setSavingMaintenance(false);

    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Save failed");
      return;
    }

    setMaintenanceEnabled(Boolean(data.maintenanceEnabled));
    await refreshConfig();
    setMsg(
      data.maintenanceEnabled
        ? "Maintenance mode ON — ads off, users see maintenance screen"
        : "Maintenance mode OFF — site is live"
    );
  };

  const saveAdsgramBlockId = async () => {
    setSavingAdsgram(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ adsgramRewardBlockId: adsgramBlockId.trim() }),
    });
    const data = await res.json();
    setSavingAdsgram(false);

    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Save failed");
      return;
    }

    setAdsgramBlockId(String(data.adsgramRewardBlockId || ""));
    await refreshConfig();
    setMsg(
      data.adsgramRewardBlockId
        ? "AdsGram block ID saved — Earn page will use rewarded ads"
        : "AdsGram block ID cleared — Earn page uses manual ad embed (if any)"
    );
  };

  if (loading) {
    return <p className="text-sm text-[var(--tg-hint)]">Loading settings…</p>;
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-2xl border border-[var(--tg-hint)]/15 bg-[var(--tg-secondary)]/40 p-4">
        <p className="text-sm font-semibold">Maintenance mode</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--tg-hint)]">
          When ON: all ads and popups stop. Regular users only see login on Profile
          with a maintenance message. Admin login still works and opens the full
          admin profile + panel.
        </p>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-[var(--tg-bg)] p-3">
          <span className="text-sm font-medium">
            {maintenanceEnabled ? "Maintenance is ON" : "Maintenance is OFF"}
          </span>
          <input
            type="checkbox"
            checked={maintenanceEnabled}
            disabled={savingMaintenance}
            onChange={(e) => void saveMaintenance(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={savingMaintenance || maintenanceEnabled}
            onClick={() => void saveMaintenance(true)}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Turn ON
          </button>
          <button
            type="button"
            disabled={savingMaintenance || !maintenanceEnabled}
            onClick={() => void saveMaintenance(false)}
            className="rounded-full bg-[var(--tg-button)] px-4 py-2 text-sm font-semibold text-[var(--tg-button-text)] disabled:opacity-50"
          >
            Turn OFF
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--tg-hint)]/15 bg-[var(--tg-secondary)]/40 p-4">
        <p className="text-sm font-semibold">AdsGram · Earn page (optional)</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--tg-hint)]">
          Paste your <strong>Rewarded</strong> block ID from{" "}
          <a
            href="https://partner.adsgram.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--tg-link)] underline"
          >
            partner.adsgram.ai
          </a>
          . Leave empty to keep using the manual rewarded ad from the Ads tab.
        </p>

        <label className="mt-4 block text-xs font-medium text-[var(--tg-hint)]">
          Block ID
        </label>
        <input
          type="text"
          value={adsgramBlockId}
          onChange={(e) => setAdsgramBlockId(e.target.value)}
          placeholder="AdsGram rewarded block ID (optional)"
          className="mt-1 w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
          autoComplete="off"
        />

        <button
          type="button"
          disabled={savingAdsgram}
          onClick={() => void saveAdsgramBlockId()}
          className="mt-3 w-full rounded-full bg-[var(--tg-button)] px-4 py-2.5 text-sm font-semibold text-[var(--tg-button-text)] disabled:opacity-50"
        >
          {savingAdsgram ? "Saving…" : "Save AdsGram block ID"}
        </button>
      </div>

      {msg ? <p className="text-xs text-[var(--tg-link)]">{msg}</p> : null}
    </div>
  );
}
