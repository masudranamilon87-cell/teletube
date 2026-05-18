import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { startRewardedSession } from "@/lib/rewarded-ads";

export async function POST() {
  try {
    const user = await requireUser();
    const result = startRewardedSession(user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
