"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { extractAdClickUrl } from "@/lib/extract-ad-click-url";
import { useSocialBarSchedule } from "@/hooks/use-social-bar-schedule";
import { mountFullscreenAd } from "@/lib/mount-fullscreen-ad";
import { mountPopupScripts } from "@/lib/mount-popup-ad";
import { SOCIAL_BAR_INTERVAL_MIN } from "@/lib/social-bar-config";
import { useTelegram } from "@/components/providers/telegram-provider";

type AdItem = { name: string; embedCode: string };

/** Fullscreen social bar: 20s after enter, then every 10 min; cycle restarts after leaving mini app. */
export function SocialBarAd() {
  const { ready, webApp } = useTelegram();
  const [open, setOpen] = useState(false);
  const [ad, setAd] = useState<AdItem | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const adHostRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(false);
  const showingRef = useRef(false);
  const scriptCleanupRef = useRef<(() => void) | null>(null);
  const scriptHostIdRef = useRef(0);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const cleanupScripts = useCallback(() => {
    scriptCleanupRef.current?.();
    scriptCleanupRef.current = null;
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setAd(null);
    setClickUrl(null);
    showingRef.current = false;
    openRef.current = false;
    cleanupScripts();
  }, [cleanupScripts]);

  const openAdLink = useCallback(
    (url: string) => {
      if (webApp?.openLink) {
        webApp.openLink(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [webApp]
  );

  const loadAd = useCallback(async (): Promise<(AdItem & { smartLink?: string | null }) | null> => {
    const res = await fetch("/api/ads?placement=social_bar", { cache: "no-store" });
    const d = await res.json();
    const first = d.ads?.[0];
    const code = first?.embedCode?.trim();
    if (!code) return null;
    return first;
  }, []);

  const presentSocialBar = useCallback(async (): Promise<void> => {
    if (showingRef.current || openRef.current) return;

    try {
      const item = await loadAd();
      const code = item?.embedCode?.trim();
      if (!item || !code) return;

      showingRef.current = true;
      cleanupScripts();

      const hostId = ++scriptHostIdRef.current;
      const host = document.createElement("div");
      host.id = `teletube-social-bar-scripts-${hostId}`;
      host.setAttribute("aria-hidden", "true");
      host.style.cssText =
        "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none";
      document.body.appendChild(host);

      const clean = mountPopupScripts(host, code);
      scriptCleanupRef.current = () => {
        clean();
        host.remove();
      };

      setAd(item);
      setClickUrl(
        (item as { smartLink?: string | null }).smartLink?.trim() ||
          extractAdClickUrl(code)
      );
      setOpen(true);
      openRef.current = true;
      return;
    } catch {
      showingRef.current = false;
    }
  }, [loadAd, cleanupScripts]);

  useSocialBarSchedule({
    enabled: ready && mounted,
    onFire: presentSocialBar,
    isBlocked: () => showingRef.current || openRef.current,
  });

  useEffect(() => {
    const el = adHostRef.current;
    if (!open || !ad || !el) return;
    const cleanup = mountFullscreenAd(el, ad.embedCode);
    return () => cleanup();
  }, [open, ad]);

  useEffect(() => () => cleanupScripts(), [cleanupScripts]);

  const handleOverlayClick = () => {
    if (clickUrl) openAdLink(clickUrl);
    close();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
  };

  if (!open || !ad || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[190] cursor-pointer bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label="Social bar advertisement"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <button
        type="button"
        onClick={handleCloseClick}
        className="absolute right-3 top-3 z-[210] flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm font-bold text-white shadow-md backdrop-blur-sm"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        aria-label="Close advertisement"
      >
        ×
      </button>

      <div
        ref={adHostRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      />

      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/40">
        Tap anywhere to open ad · × only closes · next in ~{SOCIAL_BAR_INTERVAL_MIN} min
      </p>
    </div>,
    document.body
  );
}
