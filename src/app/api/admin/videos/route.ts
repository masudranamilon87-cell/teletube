import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { videoBodySchema } from "@/lib/zod-schemas";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    const videos = db
      .select()
      .from(schema.videos)
      .orderBy(desc(schema.videos.createdAt))
      .all();
    return NextResponse.json({ videos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = videoBodySchema.parse(body);
    const now = new Date();

    db.insert(schema.videos)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const video = db
      .select()
      .from(schema.videos)
      .orderBy(desc(schema.videos.id))
      .limit(1)
      .get();

    return NextResponse.json({ video }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid fields — check URLs" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
