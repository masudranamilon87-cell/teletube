import { NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
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

export async function GET() {
  try {
    await requireAdmin();
    const ads = db
      .select()
      .from(schema.ads)
      .orderBy(asc(schema.ads.placement), asc(schema.ads.sortOrder), asc(schema.ads.id))
      .all();
    return NextResponse.json({ ads });
  } catch (e) {
    return authError(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = adBodySchema.parse(await request.json());
    const now = new Date();

    db.insert(schema.ads)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const ad = db
      .select()
      .from(schema.ads)
      .orderBy(desc(schema.ads.id))
      .limit(1)
      .get();

    return NextResponse.json({ ad }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid ad fields" }, { status: 400 });
    }
    return authError(e);
  }
}
