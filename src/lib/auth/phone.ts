import {
  isValidPhoneNumber,
  parsePhoneNumberWithError,
  type CountryCode,
} from 'libphonenumber-js';

/**
 * GCC country codes we support in V1. Kuwait default.
 * Phase 2+ expansion: already in GCC-READINESS.md — same list.
 */
export const GCC_COUNTRIES: readonly CountryCode[] = ['KW', 'SA', 'AE', 'BH', 'QA', 'OM'] as const;

export type GCCCountry = (typeof GCC_COUNTRIES)[number];

/** E.164 normalization — always store `+965XXXXXXXX`, never partial/local. */
export function normalizePhoneE164(input: string, defaultCountry: GCCCountry = 'KW'): string | null {
  try {
    const parsed = parsePhoneNumberWithError(input, defaultCountry);
    return parsed.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
}

/** True only if the number is a valid GCC E.164. */
export function isValidGCCPhone(input: string): boolean {
  if (!input) return false;
  try {
    const parsed = parsePhoneNumberWithError(input);
    return (
      parsed.isValid() && GCC_COUNTRIES.includes(parsed.country as GCCCountry)
    );
  } catch {
    return isValidPhoneNumber(input, 'KW');
  }
}

/** Mask middle digits for display after OTP send — "+965 XX XX **78". */
export function maskPhoneForDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumberWithError(e164);
    const national = parsed.nationalNumber; // e.g., "12345678"
    if (national.length < 4) return e164;
    const last = national.slice(-2);
    const masked = national.slice(0, national.length - 2).replace(/\d/g, '•');
    return `+${parsed.countryCallingCode} ${masked.replace(/(.{2})/g, '$1 ').trim()} ${last}`;
  } catch {
    return e164;
  }
}
