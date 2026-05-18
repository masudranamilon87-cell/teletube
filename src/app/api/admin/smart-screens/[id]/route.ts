import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const screenId = Number(id);
    if (!Number.isFinite(screenId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const data = smartScreenBodySchema.parse(await request.json());
    const now = new Date();

    db.update(schema.smartLinkScreens)
      .set({
        title: data.title,
        subtitle: data.subtitle ?? null,
        emoji: data.emoji,
        mediaUrl: data.mediaUrl,
        smartLink: data.smartLink,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        updatedAt: now,
      })
      .where(eq(schema.smartLinkScreens.id, screenId))
      .run();

    const screen = db
      .select()
      .from(schema.smartLinkScreens)
      .where(eq(schema.smartLinkScreens.id, screenId))
      .get();

    if (!screen) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ screen });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }
    return authError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const screenId = Number(id);
    if (!Number.isFinite(screenId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 404 });
    }

    db.delete(schema.smartLinkScreens).where(eq(schema.smartLinkScreens.id, screenId)).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
