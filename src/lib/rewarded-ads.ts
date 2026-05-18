import { and, eq, gte, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const REWARDED_DAILY_LIMIT = Number(process.env.REWARDED_DAILY_LIMIT || 10);
export const REWARDED_TOKENS = Number(process.env.REWARDED_AD_TOKENS || 5);
/** Max age of a started session before complete is rejected (minutes). */
const SESSION_MAX_AGE_MIN = Number(process.env.REWARDED_SESSION_MAX_AGE_MIN || 60);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function countCompletedToday(userId: number) {
  const since = startOfToday();
  const rows = db
    .select()
    .from(schema.rewardedAdSessions)
    .where(
      and(
        eq(schema.rewardedAdSessions.userId, userId),
        isNotNull(schema.rewardedAdSessions.completedAt),
        gte(schema.rewardedAdSessions.completedAt, since)
      )
    )
    .all();
  return rows.length;
}

export function getRewardedStatus(userId: number) {
  const viewsToday = countCompletedToday(userId);
  const remaining = Math.max(0, REWARDED_DAILY_LIMIT - viewsToday);
  return {
    viewsToday,
    dailyLimit: REWARDED_DAILY_LIMIT,
    remaining,
    rewardTokens: REWARDED_TOKENS,
    canWatch: remaining > 0,
  };
}

export function startRewardedSession(userId: number) {
  const status = getRewardedStatus(userId);
  if (!status.canWatch) {
    return { ok: false as const, error: "Daily limit reached (10 ads per day)" };
  }

  const now = new Date();
  db.insert(schema.rewardedAdSessions)
    .values({
      userId,
      startedAt: now,
      minDurationSec: 0,
      createdAt: now,
    })
    .run();

  const session = db
    .select()
    .from(schema.rewardedAdSessions)
    .where(eq(schema.rewardedAdSessions.userId, userId))
    .all()
    .sort((a, b) => b.id - a.id)[0];

  if (!session) {
    return { ok: false as const, error: "Could not start session" };
  }

  return {
    ok: true as const,
    sessionId: session.id,
    startedAt: session.startedAt.getTime(),
    ...status,
  };
}

export function completeRewardedSession(userId: number, sessionId: number) {
  const session = db
    .select()
    .from(schema.rewardedAdSessions)
    .where(eq(schema.rewardedAdSessions.id, sessionId))
    .get();

  if (!session || session.userId !== userId) {
    return { ok: false as const, error: "Invalid session" };
  }
  if (session.completedAt) {
    return { ok: false as const, error: "Already claimed" };
  }

  const viewsToday = countCompletedToday(userId);
  if (viewsToday >= REWARDED_DAILY_LIMIT) {
    return { ok: false as const, error: "Daily limit reached" };
  }

  const ageMs = Date.now() - session.startedAt.getTime();
  if (ageMs > SESSION_MAX_AGE_MIN * 60 * 1000) {
    return { ok: false as const, error: "Session expired — start a new ad" };
  }

  const now = new Date();
  db.update(schema.rewardedAdSessions)
    .set({
      completedAt: now,
      rewardAmount: REWARDED_TOKENS,
    })
    .where(eq(schema.rewardedAdSessions.id, sessionId))
    .run();

  return {
    ok: true as const,
    rewardAmount: REWARDED_TOKENS,
    viewsToday: viewsToday + 1,
  };
}
