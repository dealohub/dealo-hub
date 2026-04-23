/**
 * Localized formatting utilities.
 *
 * CRITICAL: Uses `numberingSystem: 'latn'` to force Western digits (1234)
 * even in Arabic locale. Per DECISIONS.md + DESIGN.md Section 4 —
 * Gulf users universally prefer Western digits.
 */

import type { Locale } from '@/i18n/routing';

// -----------------------------------------------------------------------------
// Currency decimals lookup
// -----------------------------------------------------------------------------

/**
 * Number of decimal places per ISO 4217 currency code.
 * KWD/BHD/OMR have 3 decimals (1 KWD = 1,000 fils).
 * Most others have 2 decimals.
 */
export const CURRENCY_DECIMALS: Record<string, number> = {
  KWD: 3,
  BHD: 3,
  OMR: 3,
  SAR: 2,
  AED: 2,
  QAR: 2,
  USD: 2,
  EUR: 2,
};

/**
 * Convert user-entered decimal amount to minor units (BIGINT-safe).
 *
 * Example: toMinorUnits(125.500, 'KWD') === 125500n
 */
export function toMinorUnits(amount: number, currency: string): bigint {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return BigInt(Math.round(amount * Math.pow(10, decimals)));
}

/**
 * Convert minor units (BIGINT from DB) to display number.
 *
 * Example: fromMinorUnits(125500n, 'KWD') === 125.5
 */
export function fromMinorUnits(minor: bigint | number, currency: string): number {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return Number(minor) / Math.pow(10, decimals);
}

// -----------------------------------------------------------------------------
// Price formatting
// -----------------------------------------------------------------------------

/**
 * Format a price in minor units for display.
 *
 * @example
 *   formatPrice(125500n, 'KWD', 'ar') // → "د.ك 125.500"
 *   formatPrice(125500n, 'KWD', 'en') // → "KWD 125.500"
 */
export function formatPrice(
  minorUnits: bigint | number,
  currency: string,
  locale: Locale
): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const amount = fromMinorUnits(minorUnits, currency);

  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    style: 'currency',
    currency,
    numberingSystem: 'latn', // ⚠️ ALWAYS Western digits in Gulf context
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format price as plain number without currency symbol.
 * Useful for inputs, sliders, data tables.
 */
export function formatPriceNumber(
  minorUnits: bigint | number,
  currency: string,
  locale: Locale
): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const amount = fromMinorUnits(minorUnits, currency);

  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numberingSystem: 'latn',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// -----------------------------------------------------------------------------
// Number formatting
// -----------------------------------------------------------------------------

/**
 * Format integer count with thousands separator.
 * Always Western digits.
 */
export function formatCount(count: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numberingSystem: 'latn',
  }).format(count);
}

/**
 * Format large numbers compactly: 1.2K, 3.4M.
 */
export function formatCompact(count: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numberingSystem: 'latn',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count);
}

/**
 * Format percentage 0-100.
 */
export function formatPercent(fraction: number, locale: Locale, decimals = 0): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numberingSystem: 'latn',
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction);
}

// -----------------------------------------------------------------------------
// Date/time formatting
// -----------------------------------------------------------------------------

/**
 * Format absolute date. Gregorian calendar (not Hijri) — default Gulf business norm.
 */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    dateStyle: 'medium',
  }).format(d);
}

/**
 * Format time only.
 */
export function formatTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numberingSystem: 'latn',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Format relative time (e.g., "قبل ساعتين" / "2 hours ago").
 * Uses Intl.RelativeTimeFormat for locale-correct phrasing.
 */
export function formatTimeAgo(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numeric: 'auto',
    style: 'long',
  });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  if (Math.abs(diffDay) < 365) return rtf.format(Math.round(diffDay / 30), 'month');
  return rtf.format(Math.round(diffDay / 365), 'year');
}
