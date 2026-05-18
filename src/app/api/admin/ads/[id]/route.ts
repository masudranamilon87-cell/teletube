import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { adBodySchema } from "@/lib/zod-schemas";

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
    const adId = Number(id);
    if (!Number.isFinite(adId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const data = adBodySchema.parse(await request.json());
    const now = new Date();

    db.update(schema.ads)
      .set({ ...data, updatedAt: now })
      .where(eq(schema.ads.id, adId))
      .run();

    const ad = db.select().from(schema.ads).where(eq(schema.ads.id, adId)).get();
    if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ad });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid ad fields" }, { status: 400 });
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
    const adId = Number(id);
    if (!Number.isFinite(adId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    db.delete(schema.ads).where(eq(schema.ads.id, adId)).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
