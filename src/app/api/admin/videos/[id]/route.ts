import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { flexUrl } from "@/lib/zod-schemas";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnailUrl: flexUrl.optional(),
  videoUrl: flexUrl.optional(),
  videoType: z
    .enum(["mp4", "mkv", "zip", "youtube", "drive", "link", "other"])
    .optional(),
  durationSec: z
    .union([z.number().int().positive(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  tokenCost: z.number().int().min(0).optional(),
  isLocked: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const videoId = Number(id);
    const data = updateSchema.parse(await request.json());

    const existing = db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.id, videoId))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.update(schema.videos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.videos.id, videoId))
      .run();

    const video = db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.id, videoId))
      .get();

    return NextResponse.json({ video });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const videoId = Number(id);

    db.delete(schema.videos).where(eq(schema.videos.id, videoId)).run();
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
