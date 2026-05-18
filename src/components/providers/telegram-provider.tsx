"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppUser = {
  id: number;
  telegramId: string;
  username: string | null;
  loginUsername: string | null;
  email: string | null;
  firstName: string | null;
  phoneVerified?: boolean;
  phoneMasked?: string | null;
  tokenBalance: number;
  isAdmin: boolean;
};

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  user: AppUser | null;
  webApp: TelegramWebApp | null;
  refreshUser: () => Promise<void>;
  login: (username: string, password: string) => Promise<string | null>;
  register: (data: {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
  }) => Promise<string | null>;
  logout: () => Promise<void>;
  watchRewardedAd: () => Promise<number | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/user/me", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.user) {
      setUser(null);
      setAuthenticated(false);
      return;
    }
    setUser(data.user);
    setAuthenticated(true);
  }, []);

  const authenticateTelegram = useCallback(async (initData: string) => {
    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ initData }),
    });
    if (!res.ok) throw new Error("Auth failed");
    const data = await res.json();
    setUser(data.user);
    setAuthenticated(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return (data.error as string) || "Login failed";
    }
    setUser(data.user);
    setAuthenticated(true);
    return null;
  }, []);

  const register = useCallback(
    async (input: {
      username: string;
      password: string;
      email?: string;
      firstName?: string;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) return (data.error as string) || "Registration failed";
      setUser(data.user);
      setAuthenticated(true);
      return null;
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setAuthenticated(false);
  }, []);

  const watchRewardedAd = useCallback(async () => {
    if (typeof window !== "undefined") {
      window.location.href = "/earn";
    }
    return null;
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
    }

    (async () => {
      try {
        let maintenance = false;
        try {
          const settingsRes = await fetch("/api/settings", { cache: "no-store" });
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            maintenance = Boolean(settings.maintenanceEnabled);
          }
        } catch {
          /* optional */
        }

        const res = await fetch("/api/user/me", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (data.user) {
          setUser(data.user);
          setAuthenticated(true);
        } else if (tg?.initData && !maintenance) {
          await authenticateTelegram(tg.initData);
        } else if (tg?.initData && maintenance) {
          try {
            await authenticateTelegram(tg.initData);
          } catch {
            /* non-admin blocked during maintenance */
          }
        }
      } catch {
        /* optional */
      } finally {
        setReady(true);
      }
    })();
  }, [authenticateTelegram]);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      user,
      webApp,
      refreshUser,
      login,
      register,
      logout,
      watchRewardedAd,
    }),
    [
      ready,
      authenticated,
      user,
      webApp,
      refreshUser,
      login,
      register,
      logout,
      watchRewardedAd,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useTelegram() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useTelegram must be used within TelegramProvider");
  return ctx;
}
