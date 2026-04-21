/**
 * App-facing types for the Landing-page dynamic surfaces
 * (`LiveFeed` + `Feature283`).
 *
 * Naming convention: camelCase for derived fields (dealerVerified?)
 * but the historical feed shape from the seed era used lower-case
 * names (`loc`, `cat`, `meta`, `image`, `ts`). To avoid rewriting
 * both consumers in the same commit as this types file lands, we
 * preserve that shape exactly — the query mapper emits identical
 * property names so `live-feed.tsx` + `live-feed-parts.tsx` keep
 * compiling with only their prop injection wired up.
 *
 * Safety: phone_e164 and email MUST NEVER appear on these shapes
 * (Decision 2 — chat-only contact).
 */

export type FeedCategoryKey = 'cars' | 'property' | 'tech' | 'jobs';

export interface FeedListing {
  kind: 'listing' | 'pricedrop';
  id: number;
  /** URL-safe listing slug — used by hero images to link into /rides/[slug]. */
  slug: string;
  cat: FeedCategoryKey;
  title: string;
  /** Compact spec line — "2024 · 1,500 km" style. */
  meta?: string;
  /** Pre-formatted current price, e.g. "AED 38,500.000". */
  price: string;
  /** Pre-formatted previous price; only set when kind='pricedrop'. */
  oldPrice?: string;
  /** Drop percent as a negative integer (e.g. -13). Only for pricedrop. */
  drop?: number;
  loc: string;
  dealer: string;
  verified?: boolean;
  featured?: boolean;
  /** Cover image URL. Rows without a cover are filtered out upstream. */
  image: string;
  /** created_at as epoch ms — drives the relative-time label. */
  ts: number;
}

/**
 * Hero-scatter image for Feature283. Sized and positioned by the
 * component's wrapper classes; the data layer provides `src` + `alt`
 * and a `href` so each scatter links into the underlying listing
 * detail page (cohesion: the listings teased up top are the ones in
 * the feed below).
 */
export interface HeroImage {
  src: string;
  alt: string;
  /** Full path with locale baked in — e.g. "/ar/rides/bmw-m5-..." */
  href: string;
  /** Slug of the underlying listing — useful as a stable React key. */
  listingSlug: string;
}

/**
 * Resolve the vertical-specific detail path for a feed listing.
 *
 * Before Phase 5f this was hard-coded to `/rides/<slug>` for every
 * feed row, which broke property listings — clicking a villa hero
 * scatter landed on a 404-ish rides page. The feed already carries
 * `cat` (FeedCategoryKey) derived from the listing's sub-category,
 * so we route by it:
 *   'cars'     → /rides/<slug>
 *   'property' → /properties/<slug>
 *   other      → landing (safe fallback until each vertical ships
 *                 its own detail page)
 */
export function verticalPathForFeedCat(
  locale: 'ar' | 'en',
  cat: FeedCategoryKey,
  slug: string,
): string {
  if (cat === 'cars') return `/${locale}/rides/${slug}`;
  if (cat === 'property') return `/${locale}/properties/${slug}`;
  return `/${locale}/`;
}
