const API_BASE = "https://api.telegram.org";

export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

export async function callTelegramApi<T>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = getBotToken();
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: T;
  };

  if (!data.ok) {
    throw new Error(data.description || `Telegram API ${method} failed`);
  }

  return data.result as T;
}
