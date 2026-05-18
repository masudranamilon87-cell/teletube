/** Accept any link — add https:// if missing */
export function normalizeMediaUrl(input: string): string {
  const u = input.trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export function isLikelyMediaUrl(input: string): boolean {
  const u = normalizeMediaUrl(input);
  try {
    new URL(u);
    return true;
  } catch {
    return u.length > 4;
  }
}
