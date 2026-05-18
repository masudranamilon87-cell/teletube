import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const screens = db
    .select({
      id: schema.smartLinkScreens.id,
      title: schema.smartLinkScreens.title,
      subtitle: schema.smartLinkScreens.subtitle,
      emoji: schema.smartLinkScreens.emoji,
      mediaUrl: schema.smartLinkScreens.mediaUrl,
      smartLink: schema.smartLinkScreens.smartLink,
    })
    .from(schema.smartLinkScreens)
    .where(
      and(
        eq(schema.smartLinkScreens.isActive, true),
        sql`trim(${schema.smartLinkScreens.smartLink}) != ''`
      )
    )
    .orderBy(asc(schema.smartLinkScreens.sortOrder), asc(schema.smartLinkScreens.id))
    .all();

  return NextResponse.json(
    { screens },
    { headers: { "Cache-Control": "no-store" } }
  );
}
