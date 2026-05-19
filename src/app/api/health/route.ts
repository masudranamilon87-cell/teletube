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

  if (!process.env.JWT_SECRET?.trim() && !process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    checks.sessionSecret = "missing — login/register will fail";
  } else {
    checks.sessionSecret = "ok";
  }

  checks.adminPassword = process.env.ADMIN_PASSWORD?.trim()
    ? "set"
    : "missing — Masudadmin login will not work until set + redeploy";

  const ready = checks.database === "ok";
  return NextResponse.json(
    {
      ok: true,
      ready,
      checks,
      hint: "Add Railway Variables and mount Volume on /app/data for persistent SQLite.",
    },
    { status: 200 }
  );
}
