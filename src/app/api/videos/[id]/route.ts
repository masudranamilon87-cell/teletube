import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getVideoForUser } from "@/lib/videos";

function fileSizeFromDescription(desc: string | null) {
  if (!desc) return null;
  const m = desc.match(/(\d+(?:\.\d+)?\s*(?:MB|GB|KB))/i);
  return m ? m[1] : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const videoId = Number(id);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const video = getVideoForUser(videoId, user?.id);

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    fileType: video.videoType,
    fileSizeLabel: fileSizeFromDescription(video.description),
    tokenCost: video.tokenCost,
    isLocked: video.isLocked,
    isUnlocked: video.isUnlocked,
    canDownload: video.canDownload,
    ...(video.canDownload ? { downloadUrl: video.videoUrl } : {}),
  };

  return NextResponse.json({ video: payload });
}
