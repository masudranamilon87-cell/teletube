"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTelegram } from "@/components/providers/telegram-provider";
import { useAppConfig } from "@/components/providers/app-config-provider";
import { BannerAdSlot } from "@/components/ads/banner-ad-slot";
import { PopadsSlot } from "@/components/ads/popads-slot";
import { PopupAd } from "@/components/ads/popup-ad";
import { SmartLinkFullscreen } from "@/components/ads/smart-link-fullscreen";
import { SocialBarAd } from "@/components/ads/social-bar-ad";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { StartParamRouter } from "@/components/telegram/start-param-router";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useTelegram();
  const { configReady, maintenanceEnabled, showAds } = useAppConfig();
  const isDownload = pathname.startsWith("/download");
  const bannerPlacement = isDownload ? "banner_download" : "banner_home";
  const isProfile = pathname.startsWith("/profile");
  const isAdminRoute = pathname.startsWith("/admin");

  const siteBlocked =
    configReady && maintenanceEnabled && !user?.isAdmin && !isProfile;

  const mainContent =
    siteBlocked && !isAdminRoute ? <MaintenanceScreen /> : children;

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-[var(--tg-bg)] text-[var(--tg-text)]">
      <StartParamRouter />
      <header className="z-30 flex shrink-0 items-center justify-between border-b border-[var(--tg-hint)]/15 bg-[var(--tg-header)] px-3 py-2.5 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--tg-link)]">
          <span>📺</span>
          <span>TeleTube</span>
        </Link>
        <div className="flex items-center gap-2">
          {ready && user && (!maintenanceEnabled || user.isAdmin) ? (
            <>
              <Link
                href="/earn"
                className="rounded-full bg-[var(--tg-secondary)] px-3 py-1 text-xs font-medium"
              >
                🪙 {user.tokenBalance}
              </Link>
              <Link
                href="/earn"
                className="rounded-full bg-[var(--tg-button)] px-3 py-1 text-xs font-semibold text-[var(--tg-button-text)]"
              >
                + Earn
              </Link>
            </>
          ) : ready ? (
            <span className="text-xs text-[var(--tg-hint)]">
              {maintenanceEnabled ? "Maintenance" : "Connecting…"}
            </span>
          ) : (
            <span className="text-xs text-[var(--tg-hint)]">Connecting…</span>
          )}
        </div>
      </header>

      {showAds ? (
        <>
          <BannerAdSlot placementId={bannerPlacement} className="mx-3 mt-2" />
          <PopadsSlot />
        </>
      ) : null}

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24">
        {mainContent}
      </main>

      <nav
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--tg-hint)]/15 bg-[var(--tg-header)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
        aria-label="Main navigation"
      >
        <div className="flex">
          <Link
            href="/"
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              pathname === "/" ? "text-[var(--tg-link)]" : "text-[var(--tg-hint)]"
            }`}
          >
            <span className="text-xl">🏠</span>
            Home
          </Link>
          <Link
            href="/earn"
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              pathname.startsWith("/earn")
                ? "text-[var(--tg-link)]"
                : "text-[var(--tg-hint)]"
            } ${maintenanceEnabled && !user?.isAdmin ? "pointer-events-none opacity-40" : ""}`}
          >
            <span className="text-xl">🪙</span>
            Earn
          </Link>
          <Link
            href="/profile"
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              pathname.startsWith("/profile")
                ? "text-[var(--tg-link)]"
                : "text-[var(--tg-hint)]"
            }`}
          >
            <span className="text-xl">{user?.isAdmin ? "⚙️" : "👤"}</span>
            Profile
          </Link>
        </div>
      </nav>

      {showAds ? (
        <>
          <SmartLinkFullscreen />
          <SocialBarAd />
          <PopupAd />
        </>
      ) : null}
    </div>
  );
}
