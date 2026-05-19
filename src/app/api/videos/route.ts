import { NextResponse } from "next/server";

import { initDatabase } from "@/lib/db";

import { getCurrentUser } from "@/lib/auth/session";

import { getPublishedVideos } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    initDatabase();

    const user = await getCurrentUser();

    const videos = getPublishedVideos(
      user?.id
    );

    return NextResponse.json({
      videos,
    });
  } catch (e) {
    console.error("[api/videos]", e);

    return NextResponse.json(
      {
        error: "Failed to load videos",
      },
      {
        status: 500,
      }
    );
  }
}
