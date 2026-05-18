import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppConfigProvider } from "@/components/providers/app-config-provider";
import { TelegramProvider } from "@/components/providers/telegram-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "TeleTube — Telegram Mini App",
  description: "Video download platform with tokens and rewards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden" suppressHydrationWarning>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <AppConfigProvider>
          <TelegramProvider>
            <AppShell>{children}</AppShell>
          </TelegramProvider>
        </AppConfigProvider>
      </body>
    </html>
  );
}
