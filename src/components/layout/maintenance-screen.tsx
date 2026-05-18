"use client";

export function MaintenanceScreen() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
      <p className="text-5xl">🔧</p>
      <h1 className="mt-4 text-xl font-bold">Site under maintenance</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--tg-hint)]">
        We are updating TeleTube. Please try again later.
      </p>
      <p className="mt-6 text-xs text-[var(--tg-hint)]">
        Use the Profile tab below to sign in.
      </p>
    </div>
  );
}
