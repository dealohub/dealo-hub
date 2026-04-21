/**
 * Site-wide configuration constants.
 *
 * `SITE_URL` is the canonical origin used everywhere we need an
 * absolute URL — sitemap, robots, email links, OpenGraph metadata.
 * Falls back to `https://dealohub.com` (matches the metadataBase in
 * `app/layout.tsx`) so prod stays correct without env wiring; preview
 * deploys can override via `NEXT_PUBLIC_SITE_URL`.
 *
 * The `LOCALES` constant is the single source of truth for the i18n
 * URL prefix list. `app/[locale]/layout.tsx` validates the dynamic
 * segment against this same list — keeping the sitemap aligned with
 * what the route actually accepts.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealohub.com'
).replace(/\/$/, '');

export const LOCALES = ['ar', 'en'] as const;
export type AppLocale = (typeof LOCALES)[number];

/** Default locale — matches next-intl config + the AR-first audience. */
export const DEFAULT_LOCALE: AppLocale = 'ar';

/**
 * Build an absolute URL from a relative path. Accepts `/foo` or `foo`
 * and never duplicates the leading slash.
 */
export function absoluteUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
