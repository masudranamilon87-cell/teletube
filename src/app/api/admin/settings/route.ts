import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getMaintenanceEnabled,
  setMaintenanceEnabled,
} from "@/lib/app-settings";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      maintenanceEnabled: getMaintenanceEnabled(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const patchSchema = z.object({
  maintenanceEnabled: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await request.json());
    setMaintenanceEnabled(body.maintenanceEnabled);
    return NextResponse.json({
      maintenanceEnabled: getMaintenanceEnabled(),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
