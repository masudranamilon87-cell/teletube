import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaintenanceEnabled } from "@/lib/app-settings";
import { toPublicUser } from "@/lib/auth/accounts";
import { createSession, getSessionSecretError } from "@/lib/auth/session";
import { registerWithPhone } from "@/lib/auth/phone-register";

const schema = z.object({
  username: z.string().min(3).max(32),
  countryDial: z.string().min(2).max(5),
  phoneNumber: z.string().min(6).max(20),
  password: z.string().min(6),
  passwordConfirm: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const secretErr = getSessionSecretError();
    if (secretErr) {
      return NextResponse.json({ error: secretErr }, { status: 503 });
    }

    if (getMaintenanceEnabled()) {
      return NextResponse.json(
        { error: "Site is under maintenance. Registration is closed." },
        { status: 503 }
      );
    }

    const body = schema.parse(await request.json());
    const result = await registerWithPhone(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await createSession(result.user.id, result.user.telegramId);

    return NextResponse.json({ user: toPublicUser(result.user) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const detail = e.issues.map((i) => i.message).join("; ");
      return NextResponse.json(
        { error: `Fill all fields (username, mobile, password x2). ${detail}` },
        { status: 400 }
      );
    }
    const msg =
      e instanceof Error && /readonly|SQLITE|ENOENT|EACCES/i.test(e.message)
        ? "Database not writable — add Railway Volume mounted at /app/data and redeploy."
        : e instanceof Error
          ? e.message
          : "Registration failed";
    console.error("[auth/register]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
