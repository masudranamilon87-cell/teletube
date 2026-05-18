/**
 * WhatsApp OTP delivery.
 *
 * WHATSAPP_PROVIDER:
 *   dev       — console + show code in app (WHATSAPP_OTP_DEV=true)
 *   callmebot — free: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 *   twilio    — Twilio WhatsApp Business
 *   http      — custom POST (WHATSAPP_API_URL + WHATSAPP_API_TOKEN)
 */

export type WhatsAppSendResult = {
  ok: boolean;
  error?: string;
  /** Only in dev — shown on screen for testing */
  devCode?: string;
  provider?: string;
};

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildMessage(code: string): string {
  return (
    process.env.WHATSAPP_OTP_MESSAGE?.replace("{code}", code) ||
    `TeleTube verification code: ${code}\n\nDo not share this code.`
  );
}

function getProvider(): string {
  const explicit = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return "twilio";
  }
  if (process.env.CALLMEBOT_API_KEY) return "callmebot";
  if (process.env.WHATSAPP_API_URL) return "http";
  return "dev";
}

function isDevFallbackAllowed(): boolean {
  return (
    process.env.WHATSAPP_OTP_DEV === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

async function sendViaCallMeBot(phoneE164: string, message: string) {
  const apikey = process.env.CALLMEBOT_API_KEY;
  if (!apikey) {
    return { ok: false as const, error: "CALLMEBOT_API_KEY not set" };
  }

  const phone = phoneE164.replace(/\D/g, "");
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", message);
  url.searchParams.set("apikey", apikey);

  const res = await fetch(url.toString(), { method: "GET" });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.error("[WhatsApp CallMeBot]", res.status, text);
    return { ok: false as const, error: "CallMeBot failed to send" };
  }

  if (/error|invalid|fail/i.test(text) && !/success|sent|ok/i.test(text)) {
    console.error("[WhatsApp CallMeBot] response:", text);
    return {
      ok: false as const,
      error:
        "CallMeBot error — add bot to contacts first (see callmebot.com)",
    };
  }

  return { ok: true as const };
}

async function sendViaTwilio(phoneE164: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from =
    process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!sid || !token) {
    return { ok: false as const, error: "Twilio credentials missing" };
  }

  const body = new URLSearchParams({
    To: `whatsapp:${phoneE164.replace(/^\+/, "+")}`,
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[WhatsApp Twilio]", res.status, errText);
    return { ok: false as const, error: "Twilio could not send WhatsApp" };
  }

  return { ok: true as const };
}

async function sendViaHttp(phoneE164: string, message: string, code: string) {
  const url = process.env.WHATSAPP_API_URL!;
  const token = process.env.WHATSAPP_API_TOKEN || "";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      phone: phoneE164,
      to: phoneE164,
      message,
      text: message,
      type: "otp",
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[WhatsApp HTTP]", res.status, text);
    return { ok: false as const, error: "WhatsApp API error" };
  }

  return { ok: true as const };
}

export async function sendWhatsAppOtp(
  phoneE164: string,
  code: string
): Promise<WhatsAppSendResult> {
  const message = buildMessage(code);
  const provider = getProvider();

  if (provider === "dev") {
    if (!isDevFallbackAllowed()) {
      return {
        ok: false,
        error:
          "WhatsApp not configured. Set CALLMEBOT_API_KEY or TWILIO credentials in .env.local",
        provider: "dev",
      };
    }
    console.info(`[WhatsApp OTP / DEV] ${phoneE164} → ${code}`);
    return { ok: true, devCode: code, provider: "dev" };
  }

  let result: { ok: boolean; error?: string };

  switch (provider) {
    case "callmebot":
      result = await sendViaCallMeBot(phoneE164, message);
      break;
    case "twilio":
      result = await sendViaTwilio(phoneE164, message);
      break;
    case "http":
      result = await sendViaHttp(phoneE164, message, code);
      break;
    default:
      result = { ok: false, error: `Unknown provider: ${provider}` };
  }

  if (!result.ok) {
    if (isDevFallbackAllowed()) {
      console.info(
        `[WhatsApp OTP / DEV fallback] ${phoneE164} → ${code} (${result.error})`
      );
      return {
        ok: true,
        devCode: code,
        provider: "dev",
        error: result.error,
      };
    }
    return { ...result, provider };
  }

  console.info(`[WhatsApp OTP] sent via ${provider} to ${phoneE164}`);
  return { ok: true, provider };
}
