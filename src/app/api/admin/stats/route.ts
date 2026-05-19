import { NextResponse } from "next/server";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const totalRow = db.select({ n: count() }).from(schema.users).get();
    const registeredRow = db
      .select({ n: count() })
      .from(schema.users)
      .where(
        and(
          isNotNull(schema.users.loginUsername),
          eq(schema.users.isAdmin, false)
        )
      )
      .get();
    const telegramRow = db
      .select({ n: count() })
      .from(schema.users)
      .where(
        and(isNull(schema.users.loginUsername), eq(schema.users.isAdmin, false))
      )
      .get();

    return NextResponse.json({
      totalUsers: totalRow?.n ?? 0,
      registeredUsers: registeredRow?.n ?? 0,
      telegramUsers: telegramRow?.n ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
