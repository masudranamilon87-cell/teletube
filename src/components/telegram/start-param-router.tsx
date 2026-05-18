"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { parseVideoIdFromStartParam } from "@/lib/telegram/mini-app-link";

/** Opens /download/[id] when user taps a channel post (startapp deep link). */
export function StartParamRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;
    const unsafe = tg?.initDataUnsafe as { start_param?: string } | undefined;
    const param =
      unsafe?.start_param ||
      new URLSearchParams(window.location.search).get("tgWebAppStartParam") ||
      new URLSearchParams(window.location.search).get("startapp");

    const videoId = parseVideoIdFromStartParam(param);
    if (videoId == null) return;

    const target = `/download/${videoId}`;
    if (pathname === target) {
      handled.current = true;
      return;
    }

    handled.current = true;
    router.replace(target);
  }, [pathname, router]);

  return null;
}
