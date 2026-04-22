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

export type FeedCategoryKey = 'cars' | 'property' | 'tech' | 'services' | 'jobs';

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
 *   'tech'     → /tech/<slug>            (Phase 7 v2)
 *   'services' → /services/<slug>        (Phase 8a)
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
  if (cat === 'tech') return `/${locale}/tech/${slug}`;
  if (cat === 'services') return `/${locale}/services/${slug}`;
  return `/${locale}/`;
}

/**
 * Pick `n` items from a feed with round-robin vertical balancing.
 *
 * Before this existed, the Landing page hero used `feed.slice(0, n)`
 * which gave a newest-first cross-section. That broke on 2026-04-22
 * when all 8 Electronics seeds landed with recent `published_at`
 * timestamps — they out-newsed the car + property seeds and swept
 * every one of the 6 hero slots, wiping the cross-vertical cohesion
 * the hero is supposed to telegraph.
 *
 * Algorithm: take the feed (already sorted newest-first), group by
 * `cat` bucket, then fill the output by round-robining across the
 * bucket order ['cars', 'property', 'tech', 'jobs']. Within each
 * bucket we consume newest-first, so the balance preserves recency
 * inside each vertical while capping any one vertical at
 * `ceil(n / non_empty_buckets)`.
 *
 * Degrades gracefully — if a bucket is empty the round-robin skips
 * it; if only one bucket has items, output is just that bucket's
 * newest `n` (same behaviour as slice, but intentional).
 *
 * Pure function. No I/O. Idempotent. Safe to call on an empty array.
 *
 * Lives in types.ts (not queries.ts) so vitest can import it without
 * pulling in the server-only `cache()` + supabase client.
 */
/**
 * Round-robin priority for pickBalancedHero. Cars first (flagship
 * vertical); property next (trust-moat differentiator); tech third;
 * jobs last (no detail page yet — safe fallback).
 *
 * Typed as a Record so adding a new FeedCategoryKey forces a
 * compile-time update here. Without this, a new vertical added to
 * the union would be silently dropped from the hero by the
 * Map-based bucketing below — exactly the kind of drift that
 * introduced the 2026-04-22 bug in the first place.
 */
const HERO_BUCKET_PRIORITY: Record<FeedCategoryKey, number> = {
  cars: 0,
  property: 1,
  tech: 2,
  services: 3,
  jobs: 4,
};

export function pickBalancedHero(
  feed: FeedListing[],
  n: number,
): FeedListing[] {
  if (n <= 0 || feed.length === 0) return [];

  const bucketOrder = (Object.keys(HERO_BUCKET_PRIORITY) as FeedCategoryKey[])
    .slice()
    .sort(
      (a, b) => HERO_BUCKET_PRIORITY[a] - HERO_BUCKET_PRIORITY[b],
    );

  const queues = new Map<FeedCategoryKey, FeedListing[]>();
  for (const key of bucketOrder) queues.set(key, []);
  for (const item of feed) {
    const q = queues.get(item.cat);
    if (q) q.push(item);
  }

  const out: FeedListing[] = [];
  let progress = true;
  while (out.length < n && progress) {
    progress = false;
    for (const key of bucketOrder) {
      if (out.length >= n) break;
      const q = queues.get(key);
      if (q && q.length > 0) {
        out.push(q.shift()!);
        progress = true;
      }
    }
  }
  return out;
}
