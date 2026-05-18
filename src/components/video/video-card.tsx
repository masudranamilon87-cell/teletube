import Link from "next/link";
import type { VideoListItem } from "@/lib/videos";
import { LINK_TYPE_LABELS, type VideoLinkType } from "@/lib/infer-file-type";
import { ThumbnailImage } from "@/components/video/thumbnail-image";

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: VideoListItem }) {
  return (
    <Link
      href={`/download/${video.id}`}
      className="block overflow-hidden rounded-2xl bg-[var(--tg-secondary)]/40 transition active:scale-[0.99]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/20">
        <ThumbnailImage
          src={video.thumbnailUrl}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {video.durationSec ? (
          <span className="absolute bottom-2 right-2 z-10 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.durationSec)}
          </span>
        ) : null}
        {video.isLocked && !video.isUnlocked ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-[var(--tg-button)] px-2 py-0.5 text-xs font-semibold text-[var(--tg-button-text)]">
            🔒 {video.tokenCost} tokens
          </span>
        ) : null}
      </div>
      <div className="flex gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--tg-secondary)] text-lg">
          🎬
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--tg-text)]">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--tg-hint)]">
            {video.isUnlocked ? "Ready" : video.isLocked ? "Locked" : "Free"} · 🔗{" "}
            {LINK_TYPE_LABELS[video.videoType as VideoLinkType] || video.videoType}
          </p>
        </div>
      </div>
    </Link>
  );
}
