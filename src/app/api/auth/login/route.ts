import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaintenanceEnabled } from "@/lib/app-settings";
import { loginAccount, toPublicUser } from "@/lib/auth/accounts";
import { createSession, getSessionSecretError } from "@/lib/auth/session";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const secretErr = getSessionSecretError();
    if (secretErr) {
      return NextResponse.json({ error: secretErr }, { status: 503 });
    }

    const body = schema.parse(await request.json());
    const result = await loginAccount(body.username, body.password);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (getMaintenanceEnabled() && !result.user.isAdmin) {
      return NextResponse.json(
        { error: "Please try again later. The site is under maintenance." },
        { status: 503 }
      );
    }

    await createSession(result.user.id, result.user.telegramId);

    return NextResponse.json({
      user: toPublicUser(result.user),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "Login failed";
    console.error("[auth/login]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
