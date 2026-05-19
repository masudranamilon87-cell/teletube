import { NextResponse } from "next/server";
import { asc, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getPhoneExportMeta } from "@/lib/phone-export";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const phones = db
      .select({
        id: schema.users.id,
        username: schema.users.loginUsername,
        phoneCountryCode: schema.users.phoneCountryCode,
        phoneNumber: schema.users.phoneNumber,
        phoneE164: schema.users.phoneE164,
        phoneVerified: schema.users.phoneVerified,
        tokenBalance: schema.users.tokenBalance,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(isNotNull(schema.users.loginUsername))
      .orderBy(asc(schema.users.createdAt))
      .all();

    return NextResponse.json({
      phones,
      total: phones.length,
      exportMeta: getPhoneExportMeta(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";

    if (msg === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (msg === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    console.error(e);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
