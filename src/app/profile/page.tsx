"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/providers/telegram-provider";
import { useAppConfig } from "@/components/providers/app-config-provider";
import { RegisterForm } from "@/components/auth/register-form";

type Tab = "login" | "register";

const MAINTENANCE_MSG = "Please try again later. The site is under maintenance.";

export default function ProfilePage() {
  const { ready, authenticated, user, login, logout, refreshUser } = useTelegram();
  const { maintenanceEnabled, setRegistrationUiActive } = useAppConfig();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const maintenanceForUser = maintenanceEnabled && !user?.isAdmin;

  useEffect(() => {
    if (maintenanceForUser) {
      setTab("login");
      setRegistrationUiActive(false);
      return;
    }
    if (tab === "register" && !authenticated) {
      setRegistrationUiActive(true);
    } else {
      setRegistrationUiActive(false);
    }
    return () => setRegistrationUiActive(false);
  }, [
    tab,
    authenticated,
    maintenanceForUser,
    setRegistrationUiActive,
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await login(loginForm.username, loginForm.password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    await refreshUser();
  };

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-2xl bg-[var(--tg-secondary)]" />;
  }

  if (authenticated && user) {
    if (maintenanceForUser) {
      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
            <p className="text-3xl">🔧</p>
            <h1 className="mt-3 text-lg font-bold">Under maintenance</h1>
            <p className="mt-2 text-sm text-[var(--tg-hint)]">{MAINTENANCE_MSG}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full rounded-2xl bg-[var(--tg-secondary)] py-3 text-sm font-medium"
          >
            Log out
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-[var(--tg-secondary)]/60 p-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tg-button)] text-2xl text-white">
            {user.isAdmin ? "⚙️" : "👤"}
          </div>
          <h1 className="text-lg font-bold">
            {user.firstName || user.loginUsername || user.username}
          </h1>
          <p className="text-sm text-[var(--tg-hint)]">
            @{user.loginUsername || user.username || "user"}
          </p>
          {user.phoneMasked ? (
            <p className="mt-1 text-xs text-[var(--tg-hint)]">
              WhatsApp {user.phoneMasked}
              {user.phoneVerified ? " ✓" : ""}
            </p>
          ) : null}
          {user.isAdmin ? (
            <span className="mt-2 inline-block rounded-full bg-[var(--tg-button)]/20 px-3 py-1 text-xs font-semibold text-[var(--tg-link)]">
              Admin account
            </span>
          ) : (
            <span className="mt-2 inline-block rounded-full bg-[var(--tg-secondary)] px-3 py-1 text-xs text-[var(--tg-hint)]">
              Member · stays logged in
            </span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[var(--tg-hint)]/15 p-4">
          <span className="text-sm">Token balance</span>
          <span className="text-lg font-bold">🪙 {user.tokenBalance}</span>
        </div>

        {!maintenanceEnabled ? (
          <Link
            href="/earn"
            className="flex w-full items-center justify-center rounded-2xl bg-[var(--tg-button)] py-3 text-sm font-semibold text-[var(--tg-button-text)]"
          >
            + Watch ad & earn tokens
          </Link>
        ) : null}

        {user.isAdmin ? (
          <Link
            href="/admin"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--tg-link)] py-3 text-sm font-semibold text-[var(--tg-link)]"
          >
            ⚙️ Open Admin Panel
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-2xl bg-[var(--tg-secondary)] py-3 text-sm font-medium text-[var(--tg-hint)]"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">
          {maintenanceEnabled && !authenticated ? "Login" : "Profile"}
        </h1>
        <p className="text-sm text-[var(--tg-hint)]">
          {maintenanceEnabled && !authenticated
            ? MAINTENANCE_MSG
            : "Login once — session saved. Register with username & mobile number."}
        </p>
      </div>

      {!(maintenanceEnabled && !authenticated) ? (
        <div className="flex rounded-xl bg-[var(--tg-secondary)] p-1">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tab === "login"
                ? "bg-[var(--tg-bg)] text-[var(--tg-link)] shadow"
                : "text-[var(--tg-hint)]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tab === "register"
                ? "bg-[var(--tg-bg)] text-[var(--tg-link)] shadow"
                : "text-[var(--tg-hint)]"
            }`}
          >
            Register
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
      ) : null}

      {tab === "login" || (maintenanceEnabled && !authenticated) ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            required
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
            autoComplete="username"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[var(--tg-button)] py-3 text-sm font-semibold text-[var(--tg-button-text)] disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
          {!(maintenanceEnabled && !authenticated) ? (
            <p className="text-center text-xs text-[var(--tg-hint)]">
              New user? Switch to Register tab
            </p>
          ) : null}
        </form>
      ) : (
        <RegisterForm
          onLoginClick={() => setTab("login")}
          onSuccess={async () => {
            await refreshUser();
          }}
        />
      )}
    </div>
  );
}
