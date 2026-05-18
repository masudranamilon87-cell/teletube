import { NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { getVideoForUser, getUserTokenBalance, unlockVideo } from "@/lib/videos";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const videoId = Number(id);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const result = unlockVideo(user.id, videoId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    const video = getVideoForUser(videoId, user.id);
    const updatedUser = await getCurrentUser();

    return NextResponse.json({
      success: true,
      result,
      tokenBalance: updatedUser ? getUserTokenBalance(updatedUser) : undefined,
      video,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
