import { NextResponse } from "next/server";
import { getMaintenanceEnabled } from "@/lib/app-settings";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const maintenanceEnabled = getMaintenanceEnabled();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { user: null, maintenanceEnabled },
      { status: 401 }
    );
  }

  if (maintenanceEnabled && !user.isAdmin) {
    return NextResponse.json(
      { user: null, maintenanceEnabled: true },
      { status: 200 }
    );
  }

  return NextResponse.json({
    user: toPublicUser(user),
    maintenanceEnabled,
  });
}
