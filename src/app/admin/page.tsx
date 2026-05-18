"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/components/providers/telegram-provider";
import { parseDurationSec } from "@/lib/parse-duration";
import { normalizeMediaUrl } from "@/lib/normalize-url";
import { inferFileType, LINK_TYPE_LABELS, type VideoLinkType } from "@/lib/infer-file-type";
import { AdminAdsPanel } from "@/components/admin/admin-ads-panel";
import { AdminPhonesPanel } from "@/components/admin/admin-phones-panel";
import { AdminSettingsPanel } from "@/components/admin/admin-settings-panel";
import { AdminSmartScreensPanel } from "@/components/admin/admin-smart-screens-panel";
import { AdminTabBar } from "@/components/admin/admin-tab-bar";
import { AdminTelegramPostHelp } from "@/components/admin/admin-telegram-post-help";
import { AdminThumbnailField } from "@/components/admin/admin-thumbnail-field";
import { ThumbnailImage } from "@/components/video/thumbnail-image";
import { resolveThumbnailUrl } from "@/lib/resolve-thumbnail";

type AdminVideo = {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  videoUrl: string;
  videoType: VideoLinkType;
  durationSec: number | null;
  tokenCost: number;
  isLocked: boolean;
  isPublished: boolean;
};

const emptyForm: {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoType: VideoLinkType;
  durationSec: string;
  tokenCost: string;
  isLocked: boolean;
  isPublished: boolean;
} = {
  title: "",
  description: "",
  thumbnailUrl: "",
  videoUrl: "",
  videoType: "link",
  durationSec: "",
  tokenCost: "0",
  isLocked: false,
  isPublished: true,
};

export default function AdminPage() {
  const router = useRouter();
  const { user, ready, authenticated } = useTelegram();
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [postToChannelOnSave, setPostToChannelOnSave] = useState(false);
  const [postingId, setPostingId] = useState<number | null>(null);
  const [tab, setTab] = useState<
    "videos" | "ads" | "smart" | "phones" | "settings"
  >("videos");

  const loadVideos = () => {
    fetch("/api/admin/videos", { credentials: "include" })
      .then((r) => {
        if (r.status === 403) router.push("/");
        return r.json();
      })
      .then((d) => setVideos(d.videos || []));
  };

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/profile");
      return;
    }
    if (!user?.isAdmin) {
      router.push("/profile");
      return;
    }
    loadVideos();
  }, [ready, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const durationSec = parseDurationSec(form.durationSec);
    if (form.durationSec.trim() && durationSec === undefined) {
      setMsg("Duration: use 2:35 or seconds (e.g. 155)");
      return;
    }

    let thumb = normalizeMediaUrl(form.thumbnailUrl);
    const videoUrl = normalizeMediaUrl(form.videoUrl);

    if (!thumb.trim() && videoUrl.trim()) {
      const fromVideo = resolveThumbnailUrl(videoUrl);
      if (fromVideo) thumb = fromVideo.thumbnailUrl;
    }

    if (!thumb.trim() || thumb.length < 12) {
      setMsg("Add a thumbnail — paste a link or use “Use from video link”");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || undefined,
      thumbnailUrl: thumb,
      videoUrl,
      videoType: form.videoType || inferFileType(videoUrl),
      durationSec,
      tokenCost: Number(form.tokenCost),
      isLocked: form.isLocked,
      isPublished: form.isPublished,
    };

    const url = editingId ? `/api/admin/videos/${editingId}` : "/api/admin/videos";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail =
        typeof err.error === "string"
          ? err.error
          : err.error?.fieldErrors
            ? "Check all fields (URLs, duration)"
            : "Save failed — login as admin?";
      setMsg(detail);
      return;
    }

    const data = await res.json();
    const savedId = editingId ?? data.video?.id;

    if (postToChannelOnSave && savedId && form.isPublished) {
      const postRes = await fetch(`/api/admin/videos/${savedId}/post-channel`, {
        method: "POST",
        credentials: "include",
      });
      const postData = await postRes.json().catch(() => ({}));
      if (!postRes.ok) {
        setMsg(
          (editingId ? "Updated" : "Created") +
            `, but channel post failed: ${postData.error || "unknown"}`
        );
      } else {
        setMsg((editingId ? "Updated" : "Created") + " and posted to Telegram channel!");
      }
    } else {
      setMsg(editingId ? "Updated!" : "Created!");
    }

    setForm(emptyForm);
    setEditingId(null);
    setPostToChannelOnSave(false);
    loadVideos();
  };

  const postToChannel = async (id: number) => {
    setPostingId(id);
    setMsg("");
    const res = await fetch(`/api/admin/videos/${id}/post-channel`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setPostingId(null);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Post to channel failed");
      return;
    }
    setMsg("Posted to Telegram channel — tap opens mini app");
  };

  const startEdit = (v: AdminVideo) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      description: v.description || "",
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
      videoType: v.videoType,
      durationSec: v.durationSec ? String(v.durationSec) : "",
      tokenCost: String(v.tokenCost),
      isLocked: v.isLocked,
      isPublished: v.isPublished,
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this video?")) return;
    await fetch(`/api/admin/videos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    loadVideos();
  };

  if (!ready || !user?.isAdmin) {
    return <p className="text-sm text-[var(--tg-hint)]">Loading admin…</p>;
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden pb-8">
      <h1 className="text-lg font-bold">Admin Panel</h1>

      <AdminTabBar
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
        tabs={[
          { id: "videos", label: "Videos" },
          { id: "ads", label: "Ads" },
          { id: "smart", label: "Smart" },
          { id: "phones", label: "Phones" },
          { id: "settings", label: "Settings" },
        ]}
      />

      {tab === "settings" ? (
        <AdminSettingsPanel />
      ) : tab === "ads" ? (
        <AdminAdsPanel />
      ) : tab === "smart" ? (
        <AdminSmartScreensPanel />
      ) : tab === "phones" ? (
        <AdminPhonesPanel />
      ) : (
        <>
      <AdminTelegramPostHelp />
      <form
        onSubmit={submit}
        className="min-w-0 space-y-3 rounded-2xl bg-[var(--tg-secondary)]/50 p-3 sm:p-4"
      >
        <p className="text-sm font-semibold">{editingId ? `Edit #${editingId}` : "Add video"}</p>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full min-w-0 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full min-w-0 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          rows={2}
        />
        <AdminThumbnailField
          value={form.thumbnailUrl}
          onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })}
          suggestFromUrl={form.videoUrl}
        />
        <label className="block text-xs text-[var(--tg-hint)]">
          Link — YouTube, Google Drive, MP4, or any website
        </label>
        <textarea
          required
          rows={3}
          placeholder="Paste any link — YouTube, Drive, website, or MP4"
          value={form.videoUrl}
          onChange={(e) => {
            const videoUrl = e.target.value;
            setForm({
              ...form,
              videoUrl,
              videoType: videoUrl.trim()
                ? inferFileType(normalizeMediaUrl(videoUrl))
                : form.videoType,
            });
          }}
          className="w-full min-w-0 break-all rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
        />
        <p className="text-[10px] text-[var(--tg-hint)]">
          Not only MP4 — YouTube, Drive, MediaFire, and any site link work
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={form.videoType}
            onChange={(e) =>
              setForm({
                ...form,
                videoType: e.target.value as VideoLinkType,
              })
            }
            className="w-full min-w-0 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          >
            {(Object.keys(LINK_TYPE_LABELS) as VideoLinkType[]).map((key) => (
              <option key={key} value={key}>
                {LINK_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
          <input
            placeholder="2:35 or 155"
            value={form.durationSec}
            onChange={(e) => setForm({ ...form, durationSec: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          />
          <input
            placeholder="Token cost"
            value={form.tokenCost}
            onChange={(e) => setForm({ ...form, tokenCost: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isLocked}
            onChange={(e) => setForm({ ...form, isLocked: e.target.checked })}
          />
          Locked (requires tokens)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={postToChannelOnSave}
            onChange={(e) => setPostToChannelOnSave(e.target.checked)}
            disabled={!form.isPublished}
          />
          Post to Telegram channel when saving
        </label>
        <p className="text-[10px] text-[var(--tg-hint)]">
          Channel post includes a button that opens this video in the mini app.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="w-full flex-1 rounded-full bg-[var(--tg-button)] py-2.5 text-sm font-semibold text-[var(--tg-button-text)] sm:w-auto"
          >
            {editingId ? "Update" : "Create"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
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
        {videos.map((v) => (
          <li
            key={v.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-[var(--tg-hint)]/15 text-sm"
          >
            <div className="flex gap-3 p-3">
              <ThumbnailImage
                src={v.thumbnailUrl}
                alt=""
                className="h-16 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold">{v.title}</p>
                <p className="mt-1 text-xs text-[var(--tg-hint)]">
                  {LINK_TYPE_LABELS[v.videoType as VideoLinkType] || v.videoType} ·{" "}
                  {v.isLocked ? `🔒 ${v.tokenCost} tokens` : "Free"}
                  {!v.isPublished ? " · draft" : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[var(--tg-hint)]/10 px-3 py-2 sm:flex-row">
              <button
                type="button"
                disabled={!v.isPublished || postingId === v.id}
                onClick={() => void postToChannel(v.id)}
                className="flex-1 rounded-lg bg-[var(--tg-button)] px-3 py-2 text-xs font-semibold text-[var(--tg-button-text)] disabled:opacity-50"
              >
                {postingId === v.id ? "Posting…" : "📢 Post to channel"}
              </button>
              <button
                type="button"
                onClick={() => startEdit(v)}
                className="flex-1 rounded-lg bg-[var(--tg-secondary)] px-3 py-2 text-xs font-medium"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(v.id)}
                className="flex-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-medium text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
        </>
      )}
    </div>
  );
}
