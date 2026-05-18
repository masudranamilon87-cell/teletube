import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { getReservedAdminUsername } from "@/lib/auth/accounts";
import {
  toE164,
  isValidLocalNumber,
  normalizePhoneNumber,
} from "@/lib/country-codes";
import { regeneratePhoneExport } from "@/lib/phone-export";
import { WELCOME_BONUS_TOKENS } from "@/lib/tokens";

export async function registerWithPhone(input: {
  username: string;
  countryDial: string;
  phoneNumber: string;
  password: string;
  passwordConfirm: string;
}) {
  const loginUsername = input.username.trim().toLowerCase();

  if (loginUsername === getReservedAdminUsername()) {
    return { ok: false as const, error: "This username is reserved" };
  }
  if (loginUsername.length < 3) {
    return { ok: false as const, error: "Username must be at least 3 characters" };
  }
  if (input.password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters" };
  }
  if (input.password !== input.passwordConfirm) {
    return { ok: false as const, error: "Passwords do not match" };
  }
  if (!isValidLocalNumber(input.phoneNumber)) {
    return { ok: false as const, error: "Enter a valid mobile number" };
  }

  const phoneE164 = toE164(input.countryDial, input.phoneNumber);
  if (!phoneE164) {
    return { ok: false as const, error: "Invalid phone number" };
  }

  const usernameTaken = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.loginUsername, loginUsername))
    .get();
  if (usernameTaken) {
    return { ok: false as const, error: "Username already taken" };
  }

  const phoneTaken = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phoneE164, phoneE164))
    .get();
  if (phoneTaken) {
    return { ok: false as const, error: "This mobile number is already registered" };
  }

  const now = new Date();
  const welcomeBonus = WELCOME_BONUS_TOKENS;
  const passwordHash = await hashPassword(input.password);
  const localDigits = normalizePhoneNumber(input.phoneNumber);

  db.insert(schema.users)
    .values({
      telegramId: `web:${loginUsername}`,
      loginUsername,
      username: loginUsername,
      firstName: loginUsername,
      passwordHash,
      phoneCountryCode: input.countryDial,
      phoneNumber: localDigits,
      phoneE164,
      phoneVerified: false,
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

  if (!user) {
    return { ok: false as const, error: "Registration failed" };
  }

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

  try {
    regeneratePhoneExport();
  } catch {
    /* export file optional */
  }

  return { ok: true as const, user };
}
