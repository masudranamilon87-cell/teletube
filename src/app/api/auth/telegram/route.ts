import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getMaintenanceEnabled } from "@/lib/app-settings";
import { validateTelegramInitData } from "@/lib/telegram/validate-init-data";
import { createSession, isAdminTelegramId } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/accounts";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const initData = body.initData as string | undefined;

    if (!initData) {
      return NextResponse.json({ error: "initData required" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const parsed = validateTelegramInitData(initData, botToken);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
    }

    const tgUser = parsed.user;
    const telegramId = String(tgUser.id);
    const now = new Date();

    let user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramId, telegramId))
      .get();

    if (!user) {
      if (getMaintenanceEnabled()) {
        return NextResponse.json(
          { error: "Please try again later. The site is under maintenance." },
          { status: 503 }
        );
      }

      const welcomeBonus = Number(process.env.WELCOME_BONUS_TOKENS || 50);
      db.insert(schema.users)
        .values({
          telegramId,
          username: tgUser.username ?? null,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name ?? null,
          photoUrl: tgUser.photo_url ?? null,
          tokenBalance: welcomeBonus,
          isAdmin: false,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      user = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.telegramId, telegramId))
        .get();

      if (user && welcomeBonus > 0) {
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
    } else {
      db.update(schema.users)
        .set({
          username: tgUser.username ?? user.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name ?? user.lastName,
          photoUrl: tgUser.photo_url ?? user.photoUrl,
          isAdmin: user.isAdmin || isAdminTelegramId(telegramId),
          updatedAt: now,
        })
        .where(eq(schema.users.id, user.id))
        .run();

      user = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, user.id))
        .get();
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    if (getMaintenanceEnabled() && !user.isAdmin) {
      return NextResponse.json(
        { error: "Please try again later. The site is under maintenance." },
        { status: 503 }
      );
    }

    await createSession(user.id, user.telegramId);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
