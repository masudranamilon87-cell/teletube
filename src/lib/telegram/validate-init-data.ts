import crypto from "crypto";

export type TelegramWebAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export type ParsedInitData = {
  user: TelegramWebAppUser;
  authDate: number;
  hash: string;
  raw: Record<string, string>;
};

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function validateTelegramInitData(
  initData: string,
  botToken: string
): ParsedInitData | null {
  if (!initData || !botToken) return null;

  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) return null;

  const checkPairs: string[] = [];
  Object.keys(data)
    .filter((k) => k !== "hash")
    .sort()
    .forEach((key) => checkPairs.push(`${key}=${data[key]}`));

  const dataCheckString = checkPairs.join("\n");
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) return null;

  const authDate = Number(data.auth_date);
  if (!authDate) return null;

  const maxAgeSec = Number(process.env.INIT_DATA_MAX_AGE_SEC || 86400);
  if (Date.now() / 1000 - authDate > maxAgeSec) return null;

  if (!data.user) return null;

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(data.user) as TelegramWebAppUser;
  } catch {
    return null;
  }

  if (!user?.id) return null;

  return { user, authDate, hash, raw: data };
}
