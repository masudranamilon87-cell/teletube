"use client";

import { AdSlot } from "@/components/ads/ad-slot";

export function PopadsSlot() {
  return (
    <div className="mx-3 mt-1 w-auto max-w-full">
      <AdSlot placement="popads" className="mx-auto w-full max-w-[320px]" />
    </div>
  );
}
