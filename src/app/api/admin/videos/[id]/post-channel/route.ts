import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { postVideoToTelegramChannel } from "@/lib/telegram/channel-post";
import { getSiteUrl } from "@/lib/telegram/site-url";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const videoId = Number(id);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
    }

    if (!getSiteUrl()) {
      return NextResponse.json(
        {
          error:
            "Set NEXT_PUBLIC_SITE_URL to your public HTTPS domain (e.g. https://yourdomain.com)",
        },
        { status: 500 }
      );
    }

    const video = db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.id, videoId))
      .get();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.isPublished) {
      return NextResponse.json(
        { error: "Publish the video first, then post to channel" },
        { status: 400 }
      );
    }

    const posted = await postVideoToTelegramChannel(video);

    return NextResponse.json({
      ok: true,
      messageId: posted.messageId,
      appUrl: posted.appUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Post failed";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
