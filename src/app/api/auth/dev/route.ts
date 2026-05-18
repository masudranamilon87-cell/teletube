import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/accounts";

/** Local browser testing only — set ALLOW_DEV_AUTH=true */
export async function POST() {
  if (process.env.ALLOW_DEV_AUTH !== "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 403 });
  }

  const telegramId = "dev_user_1";
  const now = new Date();
  let user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.telegramId, telegramId))
    .get();

  if (!user) {
    db.insert(schema.users)
      .values({
        telegramId,
        username: "devuser",
        firstName: "Dev",
        tokenBalance: 100,
        isAdmin: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramId, telegramId))
      .get();
  }

  if (!user) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  await createSession(user.id, user.telegramId);

  return NextResponse.json({ user: toPublicUser(user) });
}
