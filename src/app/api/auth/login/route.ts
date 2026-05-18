import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaintenanceEnabled } from "@/lib/app-settings";
import { loginAccount, toPublicUser } from "@/lib/auth/accounts";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
