"use client";

import { AdSlot } from "@/components/ads/ad-slot";
import { BANNER_HEIGHT, BANNER_WIDTH } from "@/lib/banner-ad";

type Props = {
  placementId: string;
  className?: string;
  /** Rotate ads when multiple exist (feed slots) */
  index?: number;
};

export function BannerAdSlot({ placementId, className = "", index = 0 }: Props) {
  return (
    <AdSlot
      placement={placementId}
      index={index}
      className={className}
      fallback={
        <div
          className="flex h-[50px] w-[320px] max-w-full items-center justify-center rounded-lg border border-dashed border-[var(--tg-hint)]/30 bg-[var(--tg-secondary)]/50 text-center text-[10px] text-[var(--tg-hint)]"
          data-ad-placement={placementId}
          data-ad-size={`${BANNER_WIDTH}x${BANNER_HEIGHT}`}
        >
          Banner {BANNER_WIDTH}×{BANNER_HEIGHT}
        </div>
      }
    />
  );
}
