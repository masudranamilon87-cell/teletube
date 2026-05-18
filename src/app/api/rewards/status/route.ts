import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getRewardedStatus } from "@/lib/rewarded-ads";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(getRewardedStatus(user.id));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
