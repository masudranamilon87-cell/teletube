/** "2:35" → 155, "90" → 90 */
export function parseDurationSec(input: string): number | undefined {
  const t = input.trim();
  if (!t) return undefined;

  if (t.includes(":")) {
    const parts = t.split(":").map((p) => Number(p.trim()));
    if (parts.some((n) => Number.isNaN(n) || n < 0)) return undefined;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return undefined;
  }

  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}
