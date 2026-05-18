"use client";

import { useCallback, useEffect, useState } from "react";

type PhoneRow = {
  id: number;
  username: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneE164: string | null;
  phoneVerified: boolean;
  tokenBalance: number;
  createdAt: string;
};

type ExportMeta = {
  updatedAt: number;
  count: number;
};

export function AdminPhonesPanel() {
  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exportMeta, setExportMeta] = useState<ExportMeta | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/phones", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setPhones(d.phones || []);
        setExportMeta(d.exportMeta || null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadTxt = async (force = false) => {
    setDownloading(true);
    try {
      const url = `/api/admin/phones/download${force ? "?force=1" : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Download failed");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || "registered-phones.txt";

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
      load();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--tg-hint)]">Loading numbers…</p>;
  }

  const lastUpdated = exportMeta?.updatedAt
    ? new Date(exportMeta.updatedAt).toLocaleString()
    : null;

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--tg-hint)]/15 bg-[var(--tg-secondary)]/40 p-4">
        <p className="text-sm font-semibold">Download numbers (.txt)</p>
        <p className="mt-1 text-xs text-[var(--tg-hint)]">
          Every user who registers is added to this .txt list — Serial, Name, Number,
          Country. New registrations are appended automatically.
        </p>
        {lastUpdated ? (
          <p className="mt-1 text-xs text-[var(--tg-hint)]">
            Last file update: {lastUpdated} · {exportMeta?.count ?? 0} numbers
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={() => downloadTxt(false)}
            className="rounded-full bg-[var(--tg-button)] px-4 py-2 text-sm font-semibold text-[var(--tg-button-text)] disabled:opacity-60"
          >
            {downloading ? "Preparing…" : "⬇️ Download .txt"}
          </button>
          <button
            type="button"
            disabled={downloading}
            onClick={() => downloadTxt(true)}
            className="rounded-full bg-[var(--tg-secondary)] px-4 py-2 text-sm font-medium"
          >
            Refresh & download
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--tg-hint)]">
        Preview — registered numbers ({phones.length})
      </p>
      {phones.length === 0 ? (
        <p className="text-center text-sm text-[var(--tg-hint)]">No phone numbers yet.</p>
      ) : (
        <ul className="space-y-2">
          {phones.map((p, i) => (
            <li
              key={p.id}
              className="rounded-xl border border-[var(--tg-hint)]/15 p-3 text-sm"
            >
              <p className="break-all font-semibold">
                {i + 1}. {p.username || "—"} · {p.phoneE164}
              </p>
              <p className="text-xs text-[var(--tg-hint)]">
                {p.phoneCountryCode} {p.phoneNumber}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
