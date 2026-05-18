import { NextResponse } from "next/server";
import { getActiveAdsForPlacement } from "@/lib/ads-query";
import { getMaintenanceEnabled } from "@/lib/app-settings";
import type { AdPlacement } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") as AdPlacement | null;

  if (!placement) {
    return NextResponse.json({ error: "placement required" }, { status: 400 });
  }

  if (getMaintenanceEnabled()) {
    return NextResponse.json(
      { ads: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  const rows = getActiveAdsForPlacement(placement);

  return NextResponse.json(
    { ads: rows },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
