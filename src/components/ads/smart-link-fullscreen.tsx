"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSmartLinkSchedule } from "@/hooks/use-smart-link-schedule";
import { SMART_LINK_INTERVAL_MIN } from "@/lib/smart-link-config";
import { useTelegram } from "@/components/providers/telegram-provider";

type Screen = {
  id: number;
  title: string;
  subtitle: string | null;
  emoji: string;
  mediaUrl: string | null;
  smartLink: string;
};

function isGifUrl(url: string) {
  return /\.gif($|\?)/i.test(url);
}

export function SmartLinkFullscreen() {
  const { ready, webApp } = useTelegram();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [mounted, setMounted] = useState(false);
  const indexRef = useRef(0);
  const openRef = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const loadScreens = useCallback(async () => {
    const res = await fetch("/api/smart-screens", { cache: "no-store" });
    const data = await res.json();
    const list: Screen[] = data.screens || [];
    setScreens(list);
    return list;
  }, []);

  useEffect(() => {
    if (ready) void loadScreens();
  }, [ready, loadScreens]);

  const present = useCallback(async () => {
    let list = screens;
    if (list.length === 0) {
      list = await loadScreens();
    }
    if (list.length === 0) return;

    const next = list[indexRef.current % list.length];
    indexRef.current = (indexRef.current + 1) % list.length;

    setScreen(next);
    setOpen(true);
    openRef.current = true;
  }, [screens, loadScreens]);

  const close = useCallback(() => {
    setOpen(false);
    setScreen(null);
    openRef.current = false;
  }, []);

  useSmartLinkSchedule({
    enabled: ready && mounted,
    onFire: present,
    isBlocked: () => openRef.current,
  });

  const openLink = useCallback(
    (url: string) => {
      if (webApp?.openLink) webApp.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    },
    [webApp]
  );

  const handleOverlayClick = () => {
    if (screen?.smartLink) openLink(screen.smartLink);
    close();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
  };

  if (!open || !screen || !mounted) return null;

  const media = screen.mediaUrl?.trim();

  return createPortal(
    <div
      className="fixed inset-0 z-[195] cursor-pointer overflow-hidden bg-black"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      {media ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
          {isGifUrl(media) ? (
            <span className="absolute left-3 top-14 rounded bg-pink-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              LIVE
            </span>
          ) : null}
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a12] via-[#2d0f1f] to-black" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

      <button
        type="button"
        onClick={handleClose}
        className="absolute right-3 top-3 z-[210] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white ring-1 ring-white/20"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        aria-label="Close"
      >
        ×
      </button>

      <div className="relative z-[205] flex h-full flex-col items-center justify-end px-4 pb-10 pt-20 text-center">
        <span className="mb-2 rounded-full bg-red-600/90 px-3 py-0.5 text-[11px] font-bold tracking-wide text-white">
          18+ ONLY
        </span>
        <p className="text-5xl leading-none drop-shadow-lg">{screen.emoji}</p>
        <h2 className="mt-3 text-2xl font-bold text-white drop-shadow-md">{screen.title}</h2>
        {screen.subtitle ? (
          <p className="mt-2 max-w-sm text-base font-medium text-pink-100">{screen.subtitle}</p>
        ) : null}
        <p className="mt-6 animate-pulse rounded-full bg-pink-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-900/60">
          TAP TO CONTINUE →
        </p>
        <p className="mt-4 text-[10px] text-white/50">
          Next landing in ~{SMART_LINK_INTERVAL_MIN} min
        </p>
      </div>
    </div>,
    document.body
  );
}
