import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { getDataDir, resolveDbPath } from "./resolve-db-path";

const DATA_DIR = getDataDir();
const DB_PATH = resolveDbPath();

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

function migrate() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      photo_url TEXT,
      token_balance INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT NOT NULL,
      video_url TEXT NOT NULL,
      video_type TEXT NOT NULL DEFAULT 'mp4',
      duration_sec INTEGER,
      token_cost INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS video_unlocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      unlocked_at INTEGER NOT NULL,
      UNIQUE(user_id, video_id)
    );
    CREATE TABLE IF NOT EXISTS token_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      placement TEXT NOT NULL,
      ad_type TEXT NOT NULL DEFAULT 'embed',
      embed_code TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const cols = sqlite.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("login_username")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN login_username TEXT`);
  }
  if (!names.has("email")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
  }
  if (!names.has("password_hash")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
  }
  if (!names.has("phone_country_code")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN phone_country_code TEXT`);
  }
  if (!names.has("phone_number")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN phone_number TEXT`);
  }
  if (!names.has("phone_e164")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN phone_e164 TEXT`);
  }
  if (!names.has("phone_verified")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0`);
  }
  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_username ON users(login_username);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_e164 ON users(phone_e164);
    CREATE TABLE IF NOT EXISTS phone_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_country_code TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      phone_e164 TEXT NOT NULL,
      login_username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_phone_verifications_e164 ON phone_verifications(phone_e164);
    CREATE TABLE IF NOT EXISTS rewarded_ad_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at INTEGER NOT NULL,
      min_duration_sec INTEGER NOT NULL,
      completed_at INTEGER,
      reward_amount INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rewarded_sessions_user ON rewarded_ad_sessions(user_id);
    CREATE TABLE IF NOT EXISTS smart_link_screens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      emoji TEXT NOT NULL DEFAULT '🔥',
      media_url TEXT,
      smart_link TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const adCols = sqlite.prepare("PRAGMA table_info(ads)").all() as { name: string }[];
  const adNames = new Set(adCols.map((c) => c.name));
  if (!adNames.has("smart_link")) {
    sqlite.exec(`ALTER TABLE ads ADD COLUMN smart_link TEXT`);
  }

  const screenCols = sqlite.prepare("PRAGMA table_info(smart_link_screens)").all() as {
    name: string;
  }[];
  const screenNames = new Set(screenCols.map((c) => c.name));
  if (screenCols.length > 0 && !screenNames.has("media_url")) {
    sqlite.exec(`ALTER TABLE smart_link_screens ADD COLUMN media_url TEXT`);
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO app_settings (key, value) VALUES ('maintenance_enabled', '0');
  `);

  seedSmartScreensIfEmpty();
}

function seedSmartScreensIfEmpty() {
  const existing = db.select().from(schema.smartLinkScreens).all();
  if (existing.length > 0) return;

  const now = new Date();
  const samples = [
    {
      title: "18+ Exclusive Zone",
      subtitle: "Tap to enter — adults only",
      emoji: "🔥",
      smartLink: "https://example.com/offer1",
      sortOrder: 0,
    },
    {
      title: "Live Video Chat",
      subtitle: "Girls are calling you now",
      emoji: "💋",
      smartLink: "https://example.com/offer2",
      sortOrder: 1,
    },
    {
      title: "Adult HD Streams",
      subtitle: "Unlimited access tonight",
      emoji: "🎬",
      smartLink: "https://example.com/offer3",
      sortOrder: 2,
    },
    {
      title: "Private Room Open",
      subtitle: "Join before it closes",
      emoji: "🔞",
      smartLink: "https://example.com/offer4",
      sortOrder: 3,
    },
    {
      title: "Hot Singles Online",
      subtitle: "Someone liked your profile",
      emoji: "💕",
      smartLink: "https://example.com/offer5",
      sortOrder: 4,
    },
  ];

  for (const s of samples) {
    db.insert(schema.smartLinkScreens)
      .values({ ...s, isActive: true, createdAt: now, updatedAt: now })
      .run();
  }
}

function seedIfEmpty() {
  const existing = db.select().from(schema.videos).all();
  if (existing.length > 0) return;

  const now = new Date();
  const samples = [
    {
      title: "Big Buck Bunny — Open Movie",
      description: "Sample long-form open movie (demo).",
      thumbnailUrl: "https://picsum.photos/seed/bunny/640/360",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      videoType: "mp4" as const,
      durationSec: 596,
      tokenCost: 10,
      isLocked: true,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Elephants Dream",
      description: "Sci-fi open film sample.",
      thumbnailUrl: "https://picsum.photos/seed/elephant/640/360",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      videoType: "mp4" as const,
      durationSec: 653,
      tokenCost: 15,
      isLocked: true,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Sintel — Fantasy Adventure",
      description: "Free preview — no unlock required.",
      thumbnailUrl: "https://picsum.photos/seed/sintel/640/360",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      videoType: "mp4" as const,
      durationSec: 888,
      tokenCost: 0,
      isLocked: false,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Sample Pack (ZIP)",
      description: "Demo download archive · 120 MB",
      thumbnailUrl: "https://picsum.photos/seed/zip/640/360",
      videoUrl: "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-zip-file.zip",
      videoType: "zip" as const,
      durationSec: null,
      tokenCost: 5,
      isLocked: false,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  db.insert(schema.videos).values(samples).run();
}

function syncAdmins() {
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminIds.length === 0) return;

  for (const telegramId of adminIds) {
    db.update(schema.users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(eq(schema.users.telegramId, telegramId))
      .run();
  }
}

function seedAdminUser() {
  const adminLogin = (process.env.ADMIN_USERNAME || "Masudadmin").trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return;

  const now = new Date();
  const passwordHash = bcrypt.hashSync(adminPass, 10);

  // Only one admin account — revoke admin from all other users
  db.update(schema.users)
    .set({ isAdmin: false, updatedAt: now })
    .run();

  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.loginUsername, adminLogin))
    .get();

  if (!user) {
    db.insert(schema.users)
      .values({
        telegramId: `web:${adminLogin}`,
        loginUsername: adminLogin,
        email: `${adminLogin}@teletube.local`,
        username: "Masudadmin",
        firstName: "Masud Admin",
        passwordHash,
        tokenBalance: 9999,
        isAdmin: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  } else {
    db.update(schema.users)
      .set({
        passwordHash,
        isAdmin: true,
        username: "Masudadmin",
        firstName: "Masud Admin",
        updatedAt: now,
      })
      .where(eq(schema.users.id, user.id))
      .run();
  }
}

function repairTruncatedUrls() {
  const DISTRICT_POSTER =
    "https://cdn.district.in/movies-assets/images/cinema/TuMeriMainTeraMainTeraTuMeri-_cover-3d813800-c821-11f0-a943-0515d6dd4dc1.jpg";
  const SAMPLE_MP4 =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const now = new Date();

  for (const v of db.select().from(schema.videos).all()) {
    const thumb = v.thumbnailUrl || "";
    const looksTruncated =
      thumb.includes("cdn.district.in") &&
      !/\.(jpg|jpeg|png|webp)$/i.test(thumb);

    if (looksTruncated) {
      db.update(schema.videos)
        .set({
          thumbnailUrl: DISTRICT_POSTER,
          videoUrl:
            v.videoUrl?.includes("cdn.district.in") &&
            !/\.(mp4|mkv|zip)$/i.test(v.videoUrl || "")
              ? SAMPLE_MP4
              : v.videoUrl,
          updatedAt: now,
        })
        .where(eq(schema.videos.id, v.id))
        .run();
    }
  }
}

migrate();
seedIfEmpty();
syncAdmins();
seedAdminUser();
repairTruncatedUrls();

export { schema };
