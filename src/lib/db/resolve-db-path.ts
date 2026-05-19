import path from "path";

/** SQLite path for TeleTube */
export function resolveDbPath(): string {
  const dataDir = path.join(process.cwd(), "data");

  const defaultPath = path.join(
    dataDir,
    "teletube.sqlite"
  );

  const explicit = process.env.SQLITE_DATABASE_PATH?.trim();

  if (explicit) {
    return explicit;
  }

  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    return defaultPath;
  }

  // Ignore Railway Postgres/MySQL URLs
  if (
    /^(postgres|postgresql|mysql|mongodb(\+srv)?):/i.test(
      url
    )
  ) {
    console.warn(
      "[db] Non-SQLite DATABASE_URL detected. Using local SQLite:",
      defaultPath
    );

    return defaultPath;
  }

  // Support file: URLs
  if (url.startsWith("file:")) {
    return url.replace(/^file:/, "");
  }

  return url;
}

export function getDataDir(): string {
  return path.join(process.cwd(), "data");
}
