import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { completeRewardedSession, getRewardedStatus } from "@/lib/rewarded-ads";
import { grantTokens, getUserTokenBalance } from "@/lib/videos";

const schema = z.object({
  sessionId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());

    const result = completeRewardedSession(user.id, body.sessionId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updated = grantTokens(
      user.id,
      result.rewardAmount,
      "reward",
      `rewarded:${body.sessionId}`
    );

    const status = getRewardedStatus(user.id);

    return NextResponse.json({
      success: true,
      earned: result.rewardAmount,
      tokenBalance: updated ? getUserTokenBalance(updated) : getUserTokenBalance(user),
      viewsToday: status.viewsToday,
      remaining: status.remaining,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
