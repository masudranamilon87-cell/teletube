import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const MAINTENANCE_SETTING_KEY = "maintenance_enabled";
export const ADSGRAM_REWARD_BLOCK_ID_KEY = "adsgram_reward_block_id";

export function getMaintenanceEnabled(): boolean {
  const row = db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, MAINTENANCE_SETTING_KEY))
    .get();
  return row?.value === "1" || row?.value === "true";
}

function getSetting(key: string): string {
  const row = db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, key))
    .get();
  return row?.value?.trim() ?? "";
}

function setSetting(key: string, value: string): void {
  const existing = db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, key))
    .get();

  if (existing) {
    db.update(schema.appSettings)
      .set({ value })
      .where(eq(schema.appSettings.key, key))
      .run();
  } else {
    db.insert(schema.appSettings).values({ key, value }).run();
  }
}

export function getAdsgramRewardBlockId(): string {
  return getSetting(ADSGRAM_REWARD_BLOCK_ID_KEY);
}

export function setAdsgramRewardBlockId(blockId: string): void {
  setSetting(ADSGRAM_REWARD_BLOCK_ID_KEY, blockId.trim());
}

export function setMaintenanceEnabled(enabled: boolean): void {
  setSetting(MAINTENANCE_SETTING_KEY, enabled ? "1" : "0");
}
