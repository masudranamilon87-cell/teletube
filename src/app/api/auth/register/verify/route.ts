import { NextResponse } from "next/server";

/** Verification disabled — use POST /api/auth/register */
export async function POST() {
  return NextResponse.json(
    { error: "WhatsApp verification is disabled. Register directly." },
    { status: 410 }
  );
}
