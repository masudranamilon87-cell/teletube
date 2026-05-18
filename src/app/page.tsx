"use client";

import { Fragment, useEffect, useState } from "react";
import { VideoCard } from "@/components/video/video-card";
import { BannerAdSlot } from "@/components/ads/banner-ad-slot";
import { useAppConfig } from "@/components/providers/app-config-provider";
import { useTelegram } from "@/components/providers/telegram-provider";
import type { VideoListItem } from "@/lib/videos";

export default function HomePage() {
  const { ready, authenticated } = useTelegram();
  const { showAds } = useAppConfig();
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/videos", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setVideos(d.videos || []))
      .finally(() => setLoading(false));
  }, [ready, authenticated]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Downloads</h1>
        <p className="text-sm text-[var(--tg-hint)]">
          Download videos · unlock with tokens, then save to device
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-[var(--tg-secondary)]" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--tg-hint)]">No videos yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {videos.map((v, i) => (
            <Fragment key={v.id}>
              <VideoCard video={v} />
              {showAds && (i + 1) % 3 === 0 ? (
                <BannerAdSlot
                  placementId="feed_interval"
                  index={Math.floor((i + 1) / 3) - 1}
                  className="my-1"
                />
              ) : null}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
