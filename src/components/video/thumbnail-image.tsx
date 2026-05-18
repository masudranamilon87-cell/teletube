"use client";

import { useState } from "react";
import { normalizeMediaUrl } from "@/lib/normalize-url";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Always relative URL — avoids SSR/client hydration mismatch */
function proxySrc(direct: string) {
  return `/api/thumbnail?url=${encodeURIComponent(normalizeMediaUrl(direct))}`;
}

export function ThumbnailImage({ src, alt, className = "" }: Props) {
  const direct = src?.trim() || "";
  const [failed, setFailed] = useState(false);

  if (!direct || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--tg-secondary)] text-3xl ${className}`}
      >
        🎬
      </div>
    );
  }

  return (
    <img
      src={proxySrc(direct)}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
