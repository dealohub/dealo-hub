import type { MetadataRoute } from 'next';
import { absoluteUrl, LOCALES } from '@/lib/config/site';
import { listingDetailHrefFromParent } from '@/lib/listings/route';
import {
  getAllPublicListingEntries,
  getAllPublicCategorySlugs,
} from './sitemap-queries';

/**
 * Sitemap composer.
 *
 * Builds the entry list that `app/sitemap.ts` returns. Split out so:
 *   • The Next.js metadata file stays a one-liner (`export default
 *     buildSitemap`).
 *   • Tests can exercise the composition logic without hitting the
 *     filesystem-based metadata convention.
 *
 * Composition (in order):
 *   1. Static top-level routes — home, /categories, vertical hubs,
 *      /search, /sell entry. Each emitted per locale with proper
 *      `alternates.languages` so Google knows the AR ↔ EN pair.
 *   2. Per-category browse pages — `/categories/[slug]` for each
 *      active top-level category.
 *   3. Per-listing detail pages — routed via `listingDetailHrefFromParent`
 *      so the URL matches whatever the buyer would actually click.
 *
 * `changeFrequency` and `priority` are hints; Google ignores `priority`
 * outright today (per their docs) and treats `changeFrequency` as
 * advisory. Set them anyway for the small handful of crawlers that
 * still honour them (Bing, Yandex).
 */

export interface BuildSitemapOptions {
  /** Inject for tests. Defaults to the live Supabase queries. */
  loadListings?: typeof getAllPublicListingEntries;
  loadCategories?: typeof getAllPublicCategorySlugs;
  /** Override `now` for stable test snapshots. */
  nowMs?: number;
}

const STATIC_TOP_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/categories', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/rides', changeFrequency: 'daily', priority: 0.9 },
  { path: '/properties', changeFrequency: 'daily', priority: 0.9 },
  { path: '/tech', changeFrequency: 'daily', priority: 0.9 },
  { path: '/search', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/sell', changeFrequency: 'monthly', priority: 0.4 },
];

export async function buildSitemap(
  opts: BuildSitemapOptions = {},
): Promise<MetadataRoute.Sitemap> {
  const loadListings = opts.loadListings ?? getAllPublicListingEntries;
  const loadCategories = opts.loadCategories ?? getAllPublicCategorySlugs;
  const now = new Date(opts.nowMs ?? Date.now()).toISOString();

  const [listings, categories] = await Promise.all([
    loadListings(),
    loadCategories(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // 1) Static top-level routes — both locales side by side.
  for (const route of STATIC_TOP_ROUTES) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(`/${locale}${route.path === '/' ? '' : route.path}`),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: makeLanguageAlternates(route.path),
        },
      });
    }
  }

  // 2) Per-category browse pages.
  for (const cat of categories) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(`/${locale}/categories/${cat.slug}`),
        lastModified: cat.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: makeLanguageAlternates(`/categories/${cat.slug}`),
        },
      });
    }
  }

  // 3) Per-listing detail pages — use the canonical route resolver so
  //    the sitemap URL matches the SearchResultCard href + the
  //    publishListing redirect target.
  for (const listing of listings) {
    for (const locale of LOCALES) {
      const path = listingDetailHrefFromParent(
        locale,
        listing.slugOrId,
        listing.parentSlug,
      );
      // listingDetailHrefFromParent already includes the `/locale`
      // prefix, so we feed it straight into absoluteUrl().
      entries.push({
        url: absoluteUrl(path),
        lastModified: listing.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: makeLanguageAlternates(stripLocale(path)),
        },
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the per-locale `alternates.languages` map for an unprefixed
 * path. Google uses this to pair AR/EN versions of the same URL.
 *
 * @param path  Path WITHOUT the locale prefix, e.g. `/categories/electronics`.
 *              Pass `/` for the home root.
 */
function makeLanguageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  const cleanPath = path === '/' ? '' : path;
  for (const locale of LOCALES) {
    const code = locale === 'ar' ? 'ar-KW' : 'en-US';
    out[code] = absoluteUrl(`/${locale}${cleanPath}`);
  }
  // Default fallback for users whose Accept-Language doesn't match.
  out['x-default'] = absoluteUrl(`/en${cleanPath}`);
  return out;
}

/**
 * Strip a `/ar` or `/en` prefix from a path so it can be re-built per
 * locale by `makeLanguageAlternates`.
 */
function stripLocale(path: string): string {
  for (const locale of LOCALES) {
    const prefix = `/${locale}`;
    if (path === prefix) return '/';
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length);
  }
  return path;
}
