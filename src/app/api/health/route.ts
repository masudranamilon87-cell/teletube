import { NextResponse } from "next/server";
import fs from "fs";
import { getDataDir, resolveDbPath } from "@/lib/db/resolve-db-path";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    node: process.version,
    env: process.env.NODE_ENV || "unknown",
  };

  try {
    const dataDir = getDataDir();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.accessSync(dataDir, fs.constants.W_OK);
    const dbPath = resolveDbPath();
    checks.database = "ok";
    checks.dbPath = dbPath;
    checks.dataDir = dataDir;
  } catch (e) {
    checks.database = "error";
    checks.databaseDetail = e instanceof Error ? e.message : String(e);
  }

  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    checks.telegramBot = "missing TELEGRAM_BOT_TOKEN";
  } else {
    checks.telegramBot = "set";
  }

  const ok = checks.database === "ok";
  return NextResponse.json(
    { ok, checks, hint: "Set Railway Variables; mount Volume on /app/data for SQLite." },
    { status: ok ? 200 : 503 }
  );
}
