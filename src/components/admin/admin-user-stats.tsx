"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  registeredUsers: number;
  telegramUsers: number;
};

export function AdminUserStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.registeredUsers === "number") {
          setStats({
            totalUsers: d.totalUsers ?? 0,
            registeredUsers: d.registeredUsers ?? 0,
            telegramUsers: d.telegramUsers ?? 0,
          });
        }
      })
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!stats) {
    return (
      <div className="h-16 animate-pulse rounded-2xl bg-[var(--tg-secondary)]/50" />
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--tg-hint)]/15 bg-[var(--tg-secondary)]/40 p-4">
      <p className="text-sm font-semibold">Users</p>
      <p className="mt-3 text-3xl font-bold text-[var(--tg-link)]">
        {stats.registeredUsers}
      </p>
      <p className="mt-1 text-sm text-[var(--tg-hint)]">
        registered (username + password)
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--tg-hint)]">
        <span>Total accounts: {stats.totalUsers}</span>
        <span>·</span>
        <span>Telegram-only: {stats.telegramUsers}</span>
      </div>
    </div>
  );
}
