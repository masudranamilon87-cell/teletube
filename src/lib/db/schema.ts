import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramId: text("telegram_id").notNull().unique(),
  loginUsername: text("login_username").unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  photoUrl: text("photo_url"),
  phoneCountryCode: text("phone_country_code"),
  phoneNumber: text("phone_number"),
  phoneE164: text("phone_e164").unique(),
  phoneVerified: integer("phone_verified", { mode: "boolean" }).notNull().default(false),
  tokenBalance: integer("token_balance").notNull().default(0),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url").notNull(),
  videoUrl: text("video_url").notNull(),
  videoType: text("video_type", {
    enum: ["mp4", "mkv", "zip", "youtube", "drive", "link", "other"],
  })
    .notNull()
    .default("link"),
  durationSec: integer("duration_sec"),
  tokenCost: integer("token_cost").notNull().default(0),
  isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const videoUnlocks = sqliteTable("video_unlocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: integer("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const phoneVerifications = sqliteTable("phone_verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phoneCountryCode: text("phone_country_code").notNull(),
  phoneNumber: text("phone_number").notNull(),
  phoneE164: text("phone_e164").notNull(),
  loginUsername: text("login_username").notNull(),
  passwordHash: text("password_hash").notNull(),
  otpHash: text("otp_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tokenTransactions = sqliteTable("token_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type", {
    enum: ["reward", "unlock", "admin", "bonus"],
  }).notNull(),
  reference: text("reference"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const ads = sqliteTable("ads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  placement: text("placement", {
    enum: [
      "banner_home",
      "banner_download",
      "feed_interval",
      "popup",
      "video_embed",
      "social_bar",
      "popads",
      "rewarded_video",
    ],
  }).notNull(),
  adType: text("ad_type", {
    enum: ["banner", "popup", "embed", "script"],
  })
    .notNull()
    .default("embed"),
  embedCode: text("embed_code").notNull().default(""),
  smartLink: text("smart_link"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type VideoUnlock = typeof videoUnlocks.$inferSelect;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type Ad = typeof ads.$inferSelect;

export const smartLinkScreens = sqliteTable("smart_link_screens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  emoji: text("emoji").notNull().default("🔥"),
  /** Image or GIF URL for fullscreen landing (admin-provided). */
  mediaUrl: text("media_url"),
  smartLink: text("smart_link").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rewardedAdSessions = sqliteTable("rewarded_ad_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  minDurationSec: integer("min_duration_sec").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  rewardAmount: integer("reward_amount"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const AD_PLACEMENTS = [
  "banner_home",
  "banner_download",
  "feed_interval",
  "popup",
  "video_embed",
  "social_bar",
  "popads",
  "rewarded_video",
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number];
