import fs from "fs";
import path from "path";
import { asc, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { COUNTRY_CODES } from "@/lib/country-codes";

const DATA_DIR = path.join(process.cwd(), "data");
export const PHONE_EXPORT_PATH = path.join(DATA_DIR, "registered-phones.txt");
const META_PATH = path.join(DATA_DIR, "phones-export-meta.json");

const DAY_MS = 24 * 60 * 60 * 1000;

type ExportMeta = {
  updatedAt: number;
  count: number;
};

function dialToCountryName(dial: string | null): string {
  if (!dial) return "Unknown";
  const found = COUNTRY_CODES.find((c) => c.dial === dial);
  return found?.name ?? dial;
}

function formatDisplayName(user: {
  loginUsername: string | null;
  username: string | null;
  firstName: string | null;
}): string {
  return user.loginUsername || user.username || user.firstName || "unknown";
}

/** Full list of every user who registered (username + phone signup) */
export function buildPhoneExportText(): string {
  const rows = db
    .select({
      loginUsername: schema.users.loginUsername,
      username: schema.users.username,
      firstName: schema.users.firstName,
      phoneCountryCode: schema.users.phoneCountryCode,
      phoneNumber: schema.users.phoneNumber,
      phoneE164: schema.users.phoneE164,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(isNotNull(schema.users.loginUsername))
    .orderBy(asc(schema.users.createdAt))
    .all();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const header = [
    "========================================",
    "   TELETUBE - REGISTERED USERS LIST",
    "========================================",
    `Date: ${dateStr}`,
    `Total registered users: ${rows.length}`,
    "",
    "Serial | Name | Number | Country",
    "----------------------------------------",
  ];

  const lines = rows.map((u, index) => {
    const serial = index + 1;
    const name = formatDisplayName(u);
    const number =
      u.phoneE164 ||
      (u.phoneCountryCode && u.phoneNumber
        ? `${u.phoneCountryCode}${u.phoneNumber}`
        : "—");
    const country = dialToCountryName(u.phoneCountryCode);
    return `${serial} | ${name} | ${number} | ${country}`;
  });

  if (lines.length === 0) {
    lines.push("(No registered users yet)");
  }

  return [...header, ...lines, "", "----------------------------------------", "End of list", ""].join(
    "\n"
  );
}

function readMeta(): ExportMeta | null {
  try {
    if (!fs.existsSync(META_PATH)) return null;
    return JSON.parse(fs.readFileSync(META_PATH, "utf8")) as ExportMeta;
  } catch {
    return null;
  }
}

function writeMeta(count: number) {
  const meta: ExportMeta = { updatedAt: Date.now(), count };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), "utf8");
}

function countExportLines(content: string): number {
  return content.split("\n").filter((l) => /^\d+ \|/.test(l)).length;
}

/** Rebuild .txt from database — every registered user included */
export function regeneratePhoneExport(): { path: string; count: number } {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const content = buildPhoneExportText();
  const count = countExportLines(content);

  fs.writeFileSync(PHONE_EXPORT_PATH, content, "utf8");
  writeMeta(count);

  return { path: PHONE_EXPORT_PATH, count };
}

/**
 * Daily auto-update on disk (24h). Download always rebuilds so list is complete.
 */
export function ensurePhoneExportFresh(force = false): ExportMeta & { path: string } {
  const meta = readMeta();
  const stale =
    !meta ||
    !fs.existsSync(PHONE_EXPORT_PATH) ||
    Date.now() - meta.updatedAt >= DAY_MS;

  if (force || stale) {
    const { path: filePath, count } = regeneratePhoneExport();
    return { updatedAt: Date.now(), count, path: filePath };
  }

  return { ...meta!, path: PHONE_EXPORT_PATH };
}

export function getPhoneExportMeta(): ExportMeta | null {
  return readMeta();
}
