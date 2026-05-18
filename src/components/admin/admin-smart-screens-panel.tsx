"use client";

import { useCallback, useEffect, useState } from "react";

type Screen = {
  id: number;
  title: string;
  subtitle: string | null;
  emoji: string;
  mediaUrl: string | null;
  smartLink: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  title: "",
  subtitle: "",
  emoji: "🔥",
  mediaUrl: "",
  smartLink: "",
  isActive: true,
  sortOrder: "0",
};

export function AdminSmartScreensPanel() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/smart-screens", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setScreens(d.screens || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      emoji: form.emoji.trim() || "🔥",
      mediaUrl: form.mediaUrl.trim() || null,
      smartLink: form.smartLink.trim(),
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };

    const url = editingId
      ? `/api/admin/smart-screens/${editingId}`
      : "/api/admin/smart-screens";
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

    setMsg(editingId ? "Updated!" : "Created!");
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const startEdit = (s: Screen) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      subtitle: s.subtitle || "",
      emoji: s.emoji,
      mediaUrl: s.mediaUrl || "",
      smartLink: s.smartLink,
      isActive: s.isActive,
      sortOrder: String(s.sortOrder),
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this screen?")) return;
    await fetch(`/api/admin/smart-screens/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <p className="text-sm text-[var(--tg-hint)]">
        Fullscreen landing: add an <strong>18+ image/GIF URL</strong> per screen (full-screen
        background). First show after 30 seconds, then every 5 minutes (rotating). Tap opens
        smart link.
      </p>

      <form
        onSubmit={submit}
        className="min-w-0 space-y-3 rounded-2xl bg-[var(--tg-secondary)]/50 p-3 sm:p-4"
      >
        <p className="text-sm font-semibold">
          {editingId ? `Edit screen #${editingId}` : "Add fullscreen screen"}
        </p>

        <input
          required
          placeholder="Headline (e.g. 18+ Live)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
        />
        <input
          placeholder="Subtext"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
        />
        <label className="block text-xs text-[var(--tg-hint)]">
          Image / GIF URL (fullscreen background)
          <input
            type="url"
            placeholder="https://cdn.../banner.gif or .jpg"
            value={form.mediaUrl}
            onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[5rem_1fr]">
          <input
            placeholder="Emoji 🔥"
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm sm:w-20"
          />
          <input
            required
            type="url"
            placeholder="Smart link URL"
            value={form.smartLink}
            onChange={(e) => setForm({ ...form, smartLink: e.target.value })}
            className="min-w-0 w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          />
        </div>
        <input
          placeholder="Sort order"
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
          Active
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-[var(--tg-button)] py-2.5 text-sm font-semibold text-[var(--tg-button-text)]"
        >
          {editingId ? "Update screen" : "Save screen"}
        </button>
        {msg ? <p className="text-xs text-[var(--tg-link)]">{msg}</p> : null}
      </form>

      <ul className="space-y-3">
        {screens.map((s) => (
          <li key={s.id} className="rounded-2xl border border-[var(--tg-hint)]/15 p-3 text-sm">
            {s.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.mediaUrl}
                alt=""
                className="mb-2 h-28 w-full rounded-xl object-cover"
              />
            ) : null}
            <p className="text-2xl">{s.emoji}</p>
            <p className="font-semibold">{s.title}</p>
            <p className="text-xs text-[var(--tg-hint)]">{s.subtitle}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-[var(--tg-link)]">
              {s.smartLink}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(s)}
                className="rounded-lg bg-[var(--tg-secondary)] px-3 py-1 text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="rounded-lg bg-red-500/15 px-3 py-1 text-xs text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
