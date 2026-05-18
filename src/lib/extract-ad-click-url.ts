/** Best-effort click URL from admin embed code (for overlay tap-through). */
export function extractAdClickUrl(embedCode: string): string | null {
  const code = embedCode.trim();
  if (!code) return null;

  const hrefMatch = code.match(/<a[^>]+href=["']([^"']+)["']/i);
  if (hrefMatch?.[1] && !hrefMatch[1].startsWith("#")) {
    return hrefMatch[1];
  }

  const onClickUrl = code.match(/(?:open|location|href)\s*[=(]\s*["'](https?:[^"']+)["']/i);
  if (onClickUrl?.[1]) return onClickUrl[1];

  const bare = code.match(/https?:\/\/[^\s"'<>]+/i);
  return bare?.[0] ?? null;
}
