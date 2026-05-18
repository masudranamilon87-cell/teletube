"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AD_PLACEMENT_LABELS,
  AD_TYPE_LABELS,
  BANNER_CODE_TEMPLATE,
  BANNER_HEIGHT,
  BANNER_WIDTH,
  placementToAdType,
} from "@/lib/ad-placements";
import type { BannerPlacement } from "@/lib/banner-ad";

type AdminAd = {
  id: number;
  name: string;
  placement: BannerPlacement | string;
  adType: string;
  embedCode: string;
  smartLink: string | null;
  isActive: boolean;
  sortOrder: number;
};

const emptyAdForm = {
  name: "",
  placement: "banner_home" as BannerPlacement,
  embedCode: "",
  smartLink: "",
  isActive: true,
  sortOrder: "0",
};

export function AdminAdsPanel() {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [form, setForm] = useState(emptyAdForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const loadAds = useCallback(() => {
    fetch("/api/admin/ads", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAds(d.ads || []));
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    const payload = {
      name: form.name.trim(),
      placement: form.placement,
      adType: placementToAdType(form.placement),
      embedCode: form.embedCode,
      smartLink: form.smartLink.trim() || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };

    const url = editingId ? `/api/admin/ads/${editingId}` : "/api/admin/ads";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMsg(typeof err.error === "string" ? err.error : "Save failed");
      return;
    }

    setMsg(editingId ? "Ad updated!" : "Ad created!");
    setForm(emptyAdForm);
    setEditingId(null);
    loadAds();
  };

  const startEdit = (a: AdminAd) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      placement: (a.placement in AD_PLACEMENT_LABELS
        ? a.placement
        : "banner_home") as BannerPlacement,
      embedCode: a.embedCode,
      smartLink: a.smartLink || "",
      isActive: a.isActive,
      sortOrder: String(a.sortOrder),
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this ad?")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE", credentials: "include" });
    loadAds();
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <p className="text-sm text-[var(--tg-hint)]">
        Social bar: first show 20s after open, then every 10 minutes (resets when user
        returns). Popup: auto interval via <code className="text-[10px]">POPUP_AD_INTERVAL_MIN</code>{" "}
        in .env. Banners are <strong>320×50</strong>. Rewarded: paste network SDK — call{" "}
        <code className="text-[10px]">TeleTubeRewarded.grant()</code> on reward,{" "}
        <code className="text-[10px]">dismiss()</code> if closed early,{" "}
        <code className="text-[10px]">noFill()</code> if no inventory. Only grant adds tokens.
      </p>

      <form
        onSubmit={submit}
        className="min-w-0 space-y-3 rounded-2xl bg-[var(--tg-secondary)]/50 p-3 sm:p-4"
      >
        <p className="text-sm font-semibold">
          {editingId ? `Edit ad #${editingId}` : "Add ad slot"}
        </p>

        <input
          required
          placeholder="Ad name (e.g. Home top)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
        />

        <label className="block text-xs text-[var(--tg-hint)]">
          Slot (placement)
          <select
            value={form.placement}
            onChange={(e) =>
              setForm({ ...form, placement: e.target.value as BannerPlacement })
            }
            className="mt-1 w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          >
            {Object.entries(AD_PLACEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-[var(--tg-hint)]">
            Banner code ({BANNER_WIDTH}×{BANNER_HEIGHT})
          </label>
          <button
            type="button"
            onClick={() => setForm({ ...form, embedCode: BANNER_CODE_TEMPLATE })}
            className="shrink-0 rounded-lg bg-[var(--tg-secondary)] px-2 py-1 text-[10px]"
          >
            Insert template
          </button>
        </div>
        <textarea
          rows={10}
          placeholder={`${BANNER_CODE_TEMPLATE}\n\nLeave empty to disable slot — cleared code hides the ad`}
          value={form.embedCode}
          onChange={(e) => setForm({ ...form, embedCode: e.target.value })}
          className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 font-mono text-xs"
        />

        <label className="block text-xs text-[var(--tg-hint)]">
          Smart link (optional — social / tap-through)
          <input
            type="url"
            placeholder="https://your-smartlink.com/..."
            value={form.smartLink}
            onChange={(e) => setForm({ ...form, smartLink: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          />
        </label>

        <input
          placeholder="Sort order (0 = first)"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active (live on site)
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="w-full flex-1 rounded-full bg-[var(--tg-button)] py-2.5 text-sm font-semibold text-[var(--tg-button-text)] sm:w-auto"
          >
            {editingId ? "Update" : "Save banner"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyAdForm);
              }}
              className="w-full rounded-full bg-[var(--tg-secondary)] px-4 py-2.5 text-sm sm:w-auto"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {msg ? <p className="text-xs text-[var(--tg-link)]">{msg}</p> : null}
      </form>

      <ul className="space-y-3">
        {ads.length === 0 ? (
          <li className="text-center text-sm text-[var(--tg-hint)]">No ads yet.</li>
        ) : (
          ads.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-[var(--tg-hint)]/15 p-3 text-sm"
            >
              <p className="font-semibold">{a.name}</p>
              <p className="text-xs text-[var(--tg-hint)]">
                {AD_PLACEMENT_LABELS[a.placement as BannerPlacement] || a.placement}
                {" · "}
                {AD_TYPE_LABELS[a.adType] || a.adType}
                {!a.isActive ? " · off" : ""}
                {a.sortOrder ? ` · order ${a.sortOrder}` : ""}
              </p>
              <p className="mt-1 line-clamp-2 font-mono text-[10px] text-[var(--tg-hint)]">
                {a.embedCode.slice(0, 120)}
                {a.embedCode.length > 120 ? "…" : ""}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="rounded-lg bg-[var(--tg-secondary)] px-3 py-1 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="rounded-lg bg-red-500/15 px-3 py-1 text-xs text-red-500"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
