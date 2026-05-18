import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const MAINTENANCE_SETTING_KEY = "maintenance_enabled";

export function getMaintenanceEnabled(): boolean {
  const row = db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, MAINTENANCE_SETTING_KEY))
    .get();
  return row?.value === "1" || row?.value === "true";
}

export function setMaintenanceEnabled(enabled: boolean): void {
  const value = enabled ? "1" : "0";
  const existing = db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, MAINTENANCE_SETTING_KEY))
    .get();

  if (existing) {
    db.update(schema.appSettings)
      .set({ value })
      .where(eq(schema.appSettings.key, MAINTENANCE_SETTING_KEY))
      .run();
  } else {
    db.insert(schema.appSettings)
      .values({ key: MAINTENANCE_SETTING_KEY, value })
      .run();
  }
}
