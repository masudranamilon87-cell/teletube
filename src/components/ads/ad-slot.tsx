"use client";

import { useEffect, useState } from "react";
import { AdEmbed } from "@/components/ads/ad-embed";
import { BANNER_HEIGHT } from "@/lib/banner-ad";

type AdItem = {
  id: number;
  name: string;
  embedCode: string;
};

type Props = {
  placement: string;
  className?: string;
  index?: number;
  fallback?: React.ReactNode;
};

export function AdSlot({ placement, className = "", index = 0, fallback }: Props) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    fetch(`/api/ads?placement=${encodeURIComponent(placement)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAds(d.ads || []))
      .catch(() => setAds([]))
      .finally(() => setReady(true));
  }, [placement]);

  const shellClass = `mx-auto w-full max-w-[320px] ${className}`;

  if (!ready) {
    return (
      <div
        className={`animate-pulse rounded-lg bg-[var(--tg-secondary)]/40 ${shellClass}`}
        style={{ height: BANNER_HEIGHT }}
        aria-hidden
      />
    );
  }

  if (ads.length === 0) {
    return fallback ? <div className={shellClass}>{fallback}</div> : null;
  }

  const ad = ads[index % ads.length];
  return (
    <AdEmbed code={ad.embedCode} className={className} label={ad.name} />
  );
}
