import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublishedVideos } from "@/lib/videos";

export async function GET() {
  const user = await getCurrentUser();
  const videos = getPublishedVideos(user?.id);
  return NextResponse.json({ videos });
}
