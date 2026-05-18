import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { smartScreenBodySchema } from "@/lib/zod-schemas";

function authError(e: unknown) {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();
    const screens = db
      .select()
      .from(schema.smartLinkScreens)
      .orderBy(asc(schema.smartLinkScreens.sortOrder), asc(schema.smartLinkScreens.id))
      .all();
    return NextResponse.json({ screens });
  } catch (e) {
    return authError(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = smartScreenBodySchema.parse(await request.json());
    const now = new Date();
    db.insert(schema.smartLinkScreens)
      .values({
        title: data.title,
        subtitle: data.subtitle ?? null,
        emoji: data.emoji,
        mediaUrl: data.mediaUrl,
        smartLink: data.smartLink,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    const screen = db.select().from(schema.smartLinkScreens).all().at(-1);
    return NextResponse.json({ screen });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }
    return authError(e);
  }
}
