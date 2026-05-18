export type CountryCode = {
  code: string;
  dial: string;
  name: string;
  flag: string;
};

/** Common codes — Bangladesh first */
export const COUNTRY_CODES: CountryCode[] = [
  { code: "BD", dial: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "IN", dial: "+91", name: "India", flag: "🇮🇳" },
  { code: "PK", dial: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "US", dial: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dial: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", dial: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "SA", dial: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "MY", dial: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", dial: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "ID", dial: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "PH", dial: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "NP", dial: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "LK", dial: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "QA", dial: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "KW", dial: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "OM", dial: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "BH", dial: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "EG", dial: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "TR", dial: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "DE", dial: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dial: "+33", name: "France", flag: "🇫🇷" },
  { code: "IT", dial: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "ES", dial: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "CA", dial: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dial: "+61", name: "Australia", flag: "🇦🇺" },
];

export function normalizePhoneNumber(local: string): string {
  return local.replace(/\D/g, "");
}

export function toE164(dial: string, localNumber: string): string {
  const digits = normalizePhoneNumber(localNumber);
  const dialDigits = dial.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith(dialDigits)) return `+${digits}`;
  return `+${dialDigits}${digits}`;
}

export function isValidLocalNumber(local: string): boolean {
  const digits = normalizePhoneNumber(local);
  return digits.length >= 6 && digits.length <= 15;
}
