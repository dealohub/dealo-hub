import type { MetadataRoute } from 'next';
import { buildSitemap } from '@/lib/seo/sitemap';

/**
 * Dynamic sitemap — Next.js Metadata Files convention.
 *
 * Returns the full URL list (static routes + categories + listings)
 * via `buildSitemap`. The composer is split into its own module so
 * tests can assert on it without invoking the metadata-file
 * machinery.
 *
 * Cached at the page level: Next.js will regenerate every 60s during
 * `revalidate`, matching the rest of the site's ISR cadence. As
 * inventory grows past ~50 000 URLs we'll switch to a sitemap index
 * (one URL per file, multiple files) — Google's per-file cap.
 */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
