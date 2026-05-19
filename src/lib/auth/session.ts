import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "teletube_session";

export function getSessionSecretError(): string | null {
  if (process.env.JWT_SECRET?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    return null;
  }
  return "Server misconfigured: add JWT_SECRET or TELEGRAM_BOT_TOKEN in Railway Variables, then redeploy.";
}

function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (!secret) throw new Error(getSessionSecretError() || "JWT_SECRET or TELEGRAM_BOT_TOKEN required");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: number;
  telegramId: string;
};

/** ~10 years — login persists until logout */
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 365 * 10;

export async function createSession(userId: number, telegramId: string) {
  const token = await new SignJWT({ userId, telegramId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = Number(payload.userId);
    const telegramId = String(payload.telegramId);
    if (!userId || !telegramId) return null;
    return { userId, telegramId };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}

export function isAdminTelegramId(telegramId: string) {
  const ids = (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(telegramId);
}
