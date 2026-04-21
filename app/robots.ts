import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/config/site';

/**
 * Robots policy.
 *
 * Allow all reputable crawlers on every public route. Block the
 * authenticated + transactional surfaces:
 *   • /sell/*           — wizard pages are noindex anyway, but this
 *                         is belt-and-braces.
 *   • /messages/*       — the chat inbox + threads are private.
 *   • /my-listings,
 *     /saved,
 *     /profile/me,
 *     /profile/edit     — owner-only views.
 *   • /api/*            — server-only endpoints (e.g. cron).
 *   • /auth-callback    — transient OAuth landing.
 *
 * `sitemap` points at the dynamic generator at /sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/sell',
          '/sell/',
          '/messages',
          '/messages/',
          '/my-listings',
          '/saved',
          '/profile/me',
          '/profile/edit',
          '/api/',
          '/auth-callback',
          '/reset-password',
          // Locale-prefixed twins (next-intl rewrites do path matching).
          '/ar/sell',
          '/en/sell',
          '/ar/messages',
          '/en/messages',
          '/ar/my-listings',
          '/en/my-listings',
          '/ar/saved',
          '/en/saved',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
