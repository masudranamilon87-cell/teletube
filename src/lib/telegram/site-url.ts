/** Public HTTPS URL of your deployed mini app (no trailing slash). */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.VERCEL_URL;

  if (!url) return "";
  if (url.startsWith("http")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
}
