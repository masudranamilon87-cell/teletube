import path from "path";

/** SQLite path for TeleTube (ignores Railway Postgres DATABASE_URL). */
export function resolveDbPath(): string {
  const dataDir = path.join(process.cwd(), "data");
  const defaultPath = path.join(dataDir, "teletube.sqlite");

  const explicit = process.env.SQLITE_DATABASE_PATH?.trim();
  if (explicit) return explicit;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) return defaultPath;

  if (/^(postgres|postgresql|mysql|mongodb(\+srv)?):/i.test(url)) {
    console.warn(
      "[db] Non-SQLite DATABASE_URL detected (e.g. Railway Postgres). Using",
      defaultPath
    );
    return defaultPath;
  }

  return url.replace(/^file:/, "");
}

export function getDataDir(): string {
  return path.join(process.cwd(), "data");
}
