"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DownloadButton } from "@/components/video/download-button";
import { ThumbnailImage } from "@/components/video/thumbnail-image";
import { useTelegram } from "@/components/providers/telegram-provider";
import { RegisterModal } from "@/components/auth/register-modal";
import { LINK_TYPE_LABELS, type VideoLinkType } from "@/lib/infer-file-type";

type VideoDetail = {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  fileType: string;
  fileSizeLabel: string | null;
  tokenCost: number;
  isLocked: boolean;
  isUnlocked: boolean;
  canDownload: boolean;
  downloadUrl?: string;
};

export default function DownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, refreshUser, ready, authenticated } = useTelegram();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/videos/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      setVideo(null);
    } else {
      setVideo(data.video);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ready) load();
  }, [ready, id]);

  const performUnlock = async () => {
    setUnlocking(true);
    setError("");
    const res = await fetch(`/api/videos/${id}/unlock`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setUnlocking(false);
    if (!res.ok) {
      if (res.status === 401) {
        setShowRegister(true);
        setError("Register or login to unlock");
        return;
      }
      setError(data.error || "Unlock failed");
      if (data.required) setError(`Need ${data.required} tokens`);
      return;
    }
    await refreshUser();
    await load();
  };

  const handleMainAction = async () => {
    if (!video) return;
    if (video.canDownload) return;
    if (!authenticated) {
      setShowRegister(true);
      return;
    }
    await performUnlock();
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-[var(--tg-secondary)]" />;
  }

  if (!video) {
    return (
      <div className="space-y-3 py-12 text-center">
        <p className="text-[var(--tg-hint)]">{error || "File not found"}</p>
        <Link href="/" className="text-[var(--tg-link)]">
          ← Back home
        </Link>
      </div>
    );
  }

  const locked = !video.canDownload;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-[var(--tg-link)]"
      >
        ← Back
      </button>

      <div className="relative aspect-video overflow-hidden rounded-2xl bg-[var(--tg-secondary)]">
        <ThumbnailImage
          src={video.thumbnailUrl}
          alt={video.title}
          className={`absolute inset-0 h-full w-full object-cover ${
            locked ? "opacity-70 blur-sm" : ""
          }`}
        />
        {locked ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <span className="text-4xl">🔒</span>
          </div>
        ) : null}
      </div>

      <div>
        <h1 className="text-lg font-bold leading-snug">{video.title}</h1>
        <p className="mt-1 text-sm text-[var(--tg-hint)]">
          {LINK_TYPE_LABELS[video.fileType as VideoLinkType] || video.fileType}
          {video.fileSizeLabel ? ` · ${video.fileSizeLabel}` : ""}
        </p>
        {video.description ? (
          <p className="mt-2 text-sm text-[var(--tg-hint)]">{video.description}</p>
        ) : null}
      </div>

      {locked ? (
        <>
          <p className="text-center text-sm text-[var(--tg-hint)]">
            Unlock for <strong>{video.tokenCost}</strong> tokens · Balance:{" "}
            {user?.tokenBalance ?? 0} 🪙
          </p>
          {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
          {!authenticated ? (
            <p className="text-center text-xs text-[var(--tg-hint)]">
              Register to unlock, then download
            </p>
          ) : null}
          <button
            type="button"
            disabled={unlocking}
            onClick={handleMainAction}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--tg-button)] py-4 text-base font-semibold text-[var(--tg-button-text)] shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            <span>⬇️</span>
            <span>
              {!authenticated
                ? "Register & download"
                : unlocking
                  ? "Unlocking…"
                  : `Unlock & download · ${video.tokenCost} tokens`}
            </span>
          </button>
        </>
      ) : video.downloadUrl ? (
        <DownloadButton
          url={video.downloadUrl}
          title={video.title}
          fileType={video.fileType}
        />
      ) : null}

      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onRegistered={async () => {
          await refreshUser();
          await performUnlock();
        }}
      />
    </div>
  );
}
