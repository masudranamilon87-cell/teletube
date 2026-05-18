"use client";

import { useEffect, useState } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { useTelegram } from "@/components/providers/telegram-provider";
import { useAppConfig } from "@/components/providers/app-config-provider";

type Props = {
  open: boolean;
  onClose: () => void;
  onRegistered?: () => void;
};

export function RegisterModal({ open, onClose, onRegistered }: Props) {
  const { refreshUser, login } = useTelegram();
  const { maintenanceEnabled, setRegistrationUiActive } = useAppConfig();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setRegistrationUiActive(false);
      return;
    }
    if (maintenanceEnabled) {
      setMode("login");
      setRegistrationUiActive(false);
      return;
    }
    if (mode === "register") {
      setRegistrationUiActive(true);
    } else {
      setRegistrationUiActive(false);
    }
    return () => setRegistrationUiActive(false);
  }, [open, mode, maintenanceEnabled, setRegistrationUiActive]);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const err = await login(loginForm.username, loginForm.password);
    setLoginLoading(false);
    if (err) {
      setLoginError(err);
      return;
    }
    await refreshUser();
    onRegistered?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[var(--tg-bg)] p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === "register" ? "Register to unlock" : "Login"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tg-secondary)] text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {maintenanceEnabled ? (
          <p className="rounded-xl bg-amber-500/10 px-3 py-3 text-sm text-amber-200/90">
            Please try again later. The site is under maintenance.
          </p>
        ) : null}

        {mode === "register" && !maintenanceEnabled ? (
          <RegisterForm
            compact
            onLoginClick={() => setMode("login")}
            onSuccess={async () => {
              await refreshUser();
              onRegistered?.();
              onClose();
            }}
          />
        ) : mode === "login" || maintenanceEnabled ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              required
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full rounded-xl border border-[var(--tg-hint)]/20 bg-[var(--tg-bg)] px-4 py-3 text-sm"
            />
            {loginError ? <p className="text-sm text-red-500">{loginError}</p> : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-2xl bg-[var(--tg-button)] py-3 text-sm font-semibold text-[var(--tg-button-text)]"
            >
              {loginLoading ? "Logging in…" : "Login"}
            </button>
            {!maintenanceEnabled ? (
              <button
                type="button"
                onClick={() => setMode("register")}
                className="w-full text-sm text-[var(--tg-link)]"
              >
                New user? Register here
              </button>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
