"use client";

import { useState } from "react";
import { COUNTRY_CODES } from "@/lib/country-codes";
import { useTelegram } from "@/components/providers/telegram-provider";

type Props = {
  onSuccess?: () => void;
  onLoginClick?: () => void;
  compact?: boolean;
};

export function RegisterForm({ onSuccess, onLoginClick, compact }: Props) {
  const { refreshUser } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    countryDial: "+880",
    phoneNumber: "",
    password: "",
    passwordConfirm: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    await refreshUser();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleRegister} className="space-y-3">
      {!compact ? (
        <p className="text-sm text-[var(--tg-hint)]">
          Username, country code, mobile number, password — no verification code needed.
        </p>
      ) : null}

      <input
        required
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
        autoComplete="username"
      />

      <div className="flex gap-2">
        <select
          value={form.countryDial}
          onChange={(e) => setForm({ ...form, countryDial: e.target.value })}
          className="w-[110px] shrink-0 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-2 py-3 text-sm"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          required
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          className="min-w-0 flex-1 rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
          autoComplete="tel-national"
        />
      </div>

      <input
        required
        type="password"
        placeholder="Password (min 6 chars)"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
        autoComplete="new-password"
      />
      <input
        required
        type="password"
        placeholder="Re-enter password"
        value={form.passwordConfirm}
        onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
        className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
        autoComplete="new-password"
      />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[var(--tg-button)] py-3 text-sm font-semibold text-[var(--tg-button-text)] disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Register"}
      </button>

      {onLoginClick ? (
        <button
          type="button"
          onClick={onLoginClick}
          className="w-full text-sm text-[var(--tg-link)]"
        >
          Already registered? Login
        </button>
      ) : null}
    </form>
  );
}
