import { NextResponse } from "next/server";
import { getMaintenanceEnabled } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    maintenanceEnabled: getMaintenanceEnabled(),
  });
}
