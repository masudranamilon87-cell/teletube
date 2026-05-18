import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { displayTokenBalance } from "@/lib/tokens";

export type VideoListItem = {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  videoType: string;
  durationSec: number | null;
  tokenCost: number;
  isLocked: boolean;
  isUnlocked: boolean;
  canDownload: boolean;
};

export function getPublishedVideos(userId?: number): VideoListItem[] {
  const rows = db
    .select()
    .from(schema.videos)
    .where(eq(schema.videos.isPublished, true))
    .orderBy(desc(schema.videos.createdAt))
    .all();

  const unlocks = userId
    ? db
        .select()
        .from(schema.videoUnlocks)
        .where(eq(schema.videoUnlocks.userId, userId))
        .all()
    : [];

  const unlockedIds = new Set(unlocks.map((u) => u.videoId));

  return rows.map((v) => {
    const isUnlocked = !v.isLocked || unlockedIds.has(v.id) || v.tokenCost === 0;
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnailUrl: v.thumbnailUrl,
      videoType: v.videoType,
      durationSec: v.durationSec,
      tokenCost: v.tokenCost,
      isLocked: v.isLocked,
      isUnlocked,
      canDownload: isUnlocked,
    };
  });
}

export function getVideoForUser(videoId: number, userId?: number) {
  const video = db
    .select()
    .from(schema.videos)
    .where(and(eq(schema.videos.id, videoId), eq(schema.videos.isPublished, true)))
    .get();

  if (!video) return null;

  let isUnlocked = !video.isLocked || video.tokenCost === 0;
  if (userId && video.isLocked) {
    const unlock = db
      .select()
      .from(schema.videoUnlocks)
      .where(
        and(
          eq(schema.videoUnlocks.userId, userId),
          eq(schema.videoUnlocks.videoId, videoId)
        )
      )
      .get();
    isUnlocked = !!unlock;
  }

  return { ...video, isUnlocked, canDownload: isUnlocked };
}

export function unlockVideo(userId: number, videoId: number) {
  const video = db
    .select()
    .from(schema.videos)
    .where(eq(schema.videos.id, videoId))
    .get();

  if (!video || !video.isPublished) {
    return { ok: false as const, error: "Video not found" };
  }

  if (!video.isLocked || video.tokenCost === 0) {
    return { ok: true as const, alreadyFree: true };
  }

  const existing = db
    .select()
    .from(schema.videoUnlocks)
    .where(
      and(
        eq(schema.videoUnlocks.userId, userId),
        eq(schema.videoUnlocks.videoId, videoId)
      )
    )
    .get();

  if (existing) return { ok: true as const, alreadyUnlocked: true };

  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return { ok: false as const, error: "User not found" };

  if (!user.isAdmin && user.tokenBalance < video.tokenCost) {
    return { ok: false as const, error: "Insufficient tokens", required: video.tokenCost };
  }

  const now = new Date();

  if (!user.isAdmin) {
    db.update(schema.users)
      .set({
        tokenBalance: user.tokenBalance - video.tokenCost,
        updatedAt: now,
      })
      .where(eq(schema.users.id, userId))
      .run();

    db.insert(schema.tokenTransactions)
      .values({
        userId,
        amount: -video.tokenCost,
        type: "unlock",
        reference: `video:${videoId}`,
        createdAt: now,
      })
      .run();
  }

  db.insert(schema.videoUnlocks)
    .values({ userId, videoId, unlockedAt: now })
    .run();

  return { ok: true as const, spent: user.isAdmin ? 0 : video.tokenCost };
}

export function getUserTokenBalance(user: typeof schema.users.$inferSelect) {
  return displayTokenBalance(user);
}

export function grantTokens(
  userId: number,
  amount: number,
  type: "reward" | "admin" | "bonus",
  reference?: string
) {
  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return null;

  if (user.isAdmin) {
    return user;
  }

  const now = new Date();
  db.update(schema.users)
    .set({
      tokenBalance: user.tokenBalance + amount,
      updatedAt: now,
    })
    .where(eq(schema.users.id, userId))
    .run();

  db.insert(schema.tokenTransactions)
    .values({ userId, amount, type, reference, createdAt: now })
    .run();

  return db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
}
