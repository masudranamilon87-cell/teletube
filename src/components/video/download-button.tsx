"use client";

import { useTelegram } from "@/components/providers/telegram-provider";
import { downloadButtonLabel } from "@/lib/infer-file-type";
import { normalizeMediaUrl } from "@/lib/normalize-url";

type Props = {
  url: string;
  title: string;
  fileType: string;
  className?: string;
};

export function DownloadButton({ url, title, fileType, className = "" }: Props) {
  const { webApp } = useTelegram();
  const link = normalizeMediaUrl(url);

  const handleDownload = () => {
    if (!link) return;
    if (webApp?.openLink) {
      webApp.openLink(link);
    } else {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const label = downloadButtonLabel(fileType);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!link}
      aria-label={label}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--tg-button)] py-4 text-base font-semibold text-[var(--tg-button-text)] shadow-lg active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      <span>🔗</span>
      <span>{label}</span>
    </button>
  );
}
