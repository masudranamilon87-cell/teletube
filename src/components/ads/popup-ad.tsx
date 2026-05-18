"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  canShowPopupNow,
  markPopupShown,
  POPUP_AD_FIRST_DELAY_MS,
  POPUP_AD_INTERVAL_MIN,
  POPUP_AD_INTERVAL_MS,
} from "@/lib/popup-ad-config";
import {
  mountPopupInterstitial,
  mountPopupScripts,
  popupHasVisibleCreative,
} from "@/lib/mount-popup-ad";
import { useTelegram } from "@/components/providers/telegram-provider";

type AdItem = { name: string; embedCode: string };

export function PopupAd() {
  const { ready } = useTelegram();
  const [ad, setAd] = useState<AdItem | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalHostRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const showingRef = useRef(false);
  const scriptHostIdRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const cleanupScripts = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const runPopup = useCallback(async () => {
    if (!canShowPopupNow() || showingRef.current) return;

    showingRef.current = true;
    cleanupScripts();

    try {
      const res = await fetch("/api/ads?placement=popup", { cache: "no-store" });
      const d = await res.json();
      const first = d.ads?.[0];
      const code = first?.embedCode?.trim();
      if (!code) {
        showingRef.current = false;
        return;
      }

      const hostId = ++scriptHostIdRef.current;
      const scriptHost = document.createElement("div");
      scriptHost.id = `teletube-popup-scripts-${hostId}`;
      scriptHost.setAttribute("aria-hidden", "true");
      scriptHost.style.cssText =
        "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;z-index:1";
      document.body.appendChild(scriptHost);

      const cleanScripts = mountPopupScripts(scriptHost, code);
      cleanupRef.current = () => {
        cleanScripts();
        scriptHost.remove();
      };

      setAd(first);
      if (popupHasVisibleCreative(code)) {
        setOpen(true);
      } else {
        showingRef.current = false;
      }

      markPopupShown();
    } catch {
      showingRef.current = false;
    }
  }, [cleanupScripts]);

  useEffect(() => {
    if (!ready || !mounted) return;

    const schedule = () => {
      if (canShowPopupNow()) void runPopup();
    };

    const firstTimer = window.setTimeout(schedule, POPUP_AD_FIRST_DELAY_MS);
    const interval = window.setInterval(schedule, POPUP_AD_INTERVAL_MS);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
      cleanupScripts();
    };
  }, [ready, mounted, runPopup, cleanupScripts]);

  useEffect(() => {
    const el = modalHostRef.current;
    if (!open || !ad || !el) return;
    const cleanup = mountPopupInterstitial(el, ad.embedCode);
    return () => cleanup();
  }, [open, ad]);

  const close = () => {
    setOpen(false);
    setAd(null);
    showingRef.current = false;
    cleanupScripts();
  };

  if (!open || !ad || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-[var(--tg-bg)] p-3 shadow-xl">
        <button
          type="button"
          onClick={close}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tg-secondary)] text-xl leading-none"
          aria-label="Close ad"
        >
          ×
        </button>
        <p className="mb-2 pr-10 text-center text-xs text-[var(--tg-hint)]">
          {ad.name}
          <span className="block text-[10px] opacity-70">
            Next in ~{POPUP_AD_INTERVAL_MIN} min
          </span>
        </p>
        <div
          ref={modalHostRef}
          className="min-h-[200px] w-full overflow-hidden rounded-xl"
        />
      </div>
    </div>,
    document.body
  );
}
