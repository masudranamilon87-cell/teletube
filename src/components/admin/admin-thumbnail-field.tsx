"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ThumbnailImage } from "@/components/video/thumbnail-image";
import { normalizeMediaUrl } from "@/lib/normalize-url";
import { resolveThumbnailUrl } from "@/lib/resolve-thumbnail";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** When set, auto-fill thumbnail from this link (e.g. video URL) if empty */
  suggestFromUrl?: string;
};

const SOURCE_LABEL: Record<string, string> = {
  youtube: "YouTube",
  drive: "Google Drive",
  direct: "Image link",
  og: "Page preview",
};

export function AdminThumbnailField({ value, onChange, suggestFromUrl }: Props) {
  const [resolving, setResolving] = useState(false);
  const [hint, setHint] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const manualEditRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyResolved = useCallback(
    (thumbnailUrl: string, src: string, auto: boolean) => {
      onChange(thumbnailUrl);
      setSource(src);
      setHint(
        auto
          ? `Thumbnail set from ${SOURCE_LABEL[src] || src}`
          : `Using ${SOURCE_LABEL[src] || src}`
      );
    },
    [onChange]
  );

  const resolveRemote = useCallback(
    async (input: string, auto: boolean) => {
      const trimmed = input.trim();
      if (!trimmed) {
        setHint("");
        setSource(null);
        return;
      }

      const local = resolveThumbnailUrl(trimmed);
      if (local) {
        applyResolved(local.thumbnailUrl, local.source, auto);
        return;
      }

      setResolving(true);
      setHint("Looking up thumbnail…");
      try {
        const res = await fetch(
          `/api/thumbnail/resolve?url=${encodeURIComponent(normalizeMediaUrl(trimmed))}`
        );
        const data = await res.json();
        if (data.thumbnailUrl) {
          applyResolved(data.thumbnailUrl, data.source || "og", auto);
        } else if (!auto) {
          setHint("Could not find a thumbnail — paste a direct image URL");
          setSource(null);
        } else {
          setHint("");
        }
      } catch {
        if (!auto) setHint("Lookup failed — try a direct image URL");
      } finally {
        setResolving(false);
      }
    },
    [applyResolved]
  );

  const scheduleResolve = useCallback(
    (input: string, auto: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void resolveRemote(input, auto);
      }, 500);
    },
    [resolveRemote]
  );

  useEffect(() => {
    if (!suggestFromUrl?.trim() || manualEditRef.current) return;
    if (value.trim()) return;
    scheduleResolve(suggestFromUrl, true);
  }, [suggestFromUrl, value, scheduleResolve]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const handleChange = (next: string) => {
    manualEditRef.current = true;
    onChange(next);
    if (!next.trim()) {
      setHint("");
      setSource(null);
      return;
    }
    scheduleResolve(next, false);
  };

  const handleBlur = () => {
    if (value.trim()) void resolveRemote(value, false);
  };

  const handlePickFromVideo = () => {
    if (!suggestFromUrl?.trim()) return;
    manualEditRef.current = false;
    void resolveRemote(suggestFromUrl, true);
  };

  const previewUrl = value.trim();

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs text-[var(--tg-hint)]">Thumbnail (poster image)</label>
        {suggestFromUrl?.trim() ? (
          <button
            type="button"
            onClick={handlePickFromVideo}
            disabled={resolving}
            className="shrink-0 rounded-lg bg-[var(--tg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--tg-link)] disabled:opacity-50"
          >
            Use from video link
          </button>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-[var(--tg-hint)]/20 bg-black/20">
          <ThumbnailImage
            src={previewUrl}
            alt="Thumbnail preview"
            className="aspect-video w-full object-cover"
          />
          {source ? (
            <p className="bg-[var(--tg-secondary)]/80 px-2 py-1 text-center text-[10px] text-[var(--tg-hint)]">
              Preview · {SOURCE_LABEL[source] || source}
              {resolving ? " · updating…" : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-[var(--tg-hint)]/25 bg-[var(--tg-secondary)]/30 px-3 text-center text-xs text-[var(--tg-hint)]">
          Paste YouTube, Drive, or image URL — preview appears here
        </div>
      )}

      <textarea
        required
        rows={2}
        placeholder="YouTube / Drive / direct image URL (https://…)"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="w-full min-w-0 break-all rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-3 py-2 text-sm"
      />
      {hint ? (
        <p className="text-[10px] text-[var(--tg-link)]">{hint}</p>
      ) : (
        <p className="text-[10px] text-[var(--tg-hint)]">
          Supports YouTube, Google Drive, CDN images, and most sites (og:image)
        </p>
      )}
    </div>
  );
}
