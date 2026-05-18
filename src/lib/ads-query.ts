import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { AdPlacement } from "@/lib/db/schema";

/** Active ads with non-empty embed code (deleted/cleared code = hidden). */
export function getActiveAdsForPlacement(placement: AdPlacement) {
  return db
    .select({
      id: schema.ads.id,
      name: schema.ads.name,
      placement: schema.ads.placement,
      adType: schema.ads.adType,
      embedCode: schema.ads.embedCode,
      smartLink: schema.ads.smartLink,
    })
    .from(schema.ads)
    .where(
      and(
        eq(schema.ads.placement, placement),
        eq(schema.ads.isActive, true),
        sql`trim(${schema.ads.embedCode}) != ''`
      )
    )
    .orderBy(asc(schema.ads.sortOrder), asc(schema.ads.id))
    .all();
}
