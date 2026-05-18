"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AppConfigValue = {
  configReady: boolean;
  maintenanceEnabled: boolean;
  registrationUiActive: boolean;
  /** No ads during maintenance or registration UI */
  showAds: boolean;
  setRegistrationUiActive: (active: boolean) => void;
  refreshConfig: () => Promise<void>;
};

const AppConfigContext = createContext<AppConfigValue | null>(null);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [configReady, setConfigReady] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [registrationUiActive, setRegistrationUiActive] = useState(false);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceEnabled(Boolean(data.maintenanceEnabled));
      }
    } catch {
      /* keep last value */
    } finally {
      setConfigReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const showAds = !maintenanceEnabled && !registrationUiActive;

  const value = useMemo(
    () => ({
      configReady,
      maintenanceEnabled,
      registrationUiActive,
      showAds,
      setRegistrationUiActive,
      refreshConfig,
    }),
    [
      configReady,
      maintenanceEnabled,
      registrationUiActive,
      showAds,
      refreshConfig,
    ]
  );

  return (
    <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return ctx;
}
