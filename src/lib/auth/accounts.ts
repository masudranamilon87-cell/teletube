import { eq, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { displayTokenBalance, WELCOME_BONUS_TOKENS } from "@/lib/tokens";

export function toPublicUser(user: typeof schema.users.$inferSelect) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    loginUsername: user.loginUsername,
    email: user.email,
    firstName: user.firstName,
    phoneVerified: user.phoneVerified,
    phoneMasked: user.phoneE164
      ? maskPhone(user.phoneE164)
      : null,
    tokenBalance: displayTokenBalance(user),
    isAdmin: user.isAdmin,
  };
}

function maskPhone(e164: string) {
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `+${digits.slice(0, 2)}******${digits.slice(-2)}`;
}

export function getReservedAdminUsername() {
  return (process.env.ADMIN_USERNAME || "Masudadmin").trim().toLowerCase();
}

export async function findByLogin(login: string) {
  const normalized = login.trim().toLowerCase();
  return db
    .select()
    .from(schema.users)
    .where(
      or(
        eq(schema.users.loginUsername, normalized),
        eq(schema.users.email, normalized)
      )
    )
    .get();
}

export async function registerAccount(input: {
  loginUsername: string;
  email?: string;
  password: string;
  firstName?: string;
}) {
  const loginUsername = input.loginUsername.trim().toLowerCase();
  const email = input.email?.trim().toLowerCase() || null;

  if (loginUsername === getReservedAdminUsername()) {
    return { ok: false as const, error: "This username is reserved" };
  }

  if (loginUsername.length < 3) {
    return { ok: false as const, error: "Username must be at least 3 characters" };
  }
  if (input.password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters" };
  }

  const exists = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.loginUsername, loginUsername))
    .get();
  if (exists) return { ok: false as const, error: "Username already taken" };

  if (email) {
    const emailTaken = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .get();
    if (emailTaken) return { ok: false as const, error: "Email already registered" };
  }

  const now = new Date();
  const welcomeBonus = WELCOME_BONUS_TOKENS;
  const passwordHash = await hashPassword(input.password);

  db.insert(schema.users)
    .values({
      telegramId: `web:${loginUsername}`,
      loginUsername,
      email,
      username: loginUsername,
      firstName: input.firstName || loginUsername,
      passwordHash,
      tokenBalance: welcomeBonus,
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.loginUsername, loginUsername))
    .get();

  if (!user) return { ok: false as const, error: "Registration failed" };

  if (welcomeBonus > 0) {
    db.insert(schema.tokenTransactions)
      .values({
        userId: user.id,
        amount: welcomeBonus,
        type: "bonus",
        reference: "welcome",
        createdAt: now,
      })
      .run();
  }

  return { ok: true as const, user };
}

export async function loginAccount(login: string, password: string) {
  const user = await findByLogin(login);
  if (!user?.passwordHash) {
    return { ok: false as const, error: "Invalid username or password" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false as const, error: "Invalid username or password" };

  return { ok: true as const, user };
}

