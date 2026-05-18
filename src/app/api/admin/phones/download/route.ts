import { NextResponse } from "next/server";
import fs from "fs";
import { requireAdmin } from "@/lib/auth/session";
import { ensurePhoneExportFresh, PHONE_EXPORT_PATH } from "@/lib/phone-export";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    // Always rebuild from DB so file has every registered user
    const meta = ensurePhoneExportFresh(true);
    const content = fs.readFileSync(PHONE_EXPORT_PATH, "utf8");

    const date = new Date(meta.updatedAt).toISOString().slice(0, 10);
    const filename = `registered-phones-${date}.txt`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
