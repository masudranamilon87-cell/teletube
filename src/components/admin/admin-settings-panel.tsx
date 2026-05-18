"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppConfig } from "@/components/providers/app-config-provider";

export function AdminSettingsPanel() {
  const { refreshConfig } = useAppConfig();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setMaintenanceEnabled(Boolean(d.maintenanceEnabled));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (enabled: boolean) => {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ maintenanceEnabled: enabled }),
    });
    const data = await res.json();
    setSaving(false);

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
            disabled={saving}
            onChange={(e) => void save(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving || maintenanceEnabled}
            onClick={() => void save(true)}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Turn ON
          </button>
          <button
            type="button"
            disabled={saving || !maintenanceEnabled}
            onClick={() => void save(false)}
            className="rounded-full bg-[var(--tg-button)] px-4 py-2 text-sm font-semibold text-[var(--tg-button-text)] disabled:opacity-50"
          >
            Turn OFF
          </button>
        </div>

        {msg ? <p className="mt-3 text-xs text-[var(--tg-link)]">{msg}</p> : null}
      </div>
    </div>
  );
}
