import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * next-intl routing configuration.
 *
 * V1: 2 locales (ar default, en). RTL handled in [locale]/layout.tsx.
 *
 * URL patterns:
 *   /ar/listings/...  (Arabic, default — may appear as / via prefix: 'as-needed')
 *   /en/listings/...  (English)
 */

export const routing = defineRouting({
  locales: ['ar', 'en'] as const,
  defaultLocale: 'ar',
  localePrefix: 'always', // Always include locale in URL for clarity + SEO
});

export type Locale = (typeof routing.locales)[number];

// Typed navigation helpers (next-intl 4 API)
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
