import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/format';
import type { FeedCategoryKey, FeedListing } from './types';

/**
 * Read-side queries for the Landing page.
 *
 * Conventions mirror src/lib/rides/queries.ts:
 *   - createClient() from @/lib/supabase/server (RLS-respecting).
 *   - React cache() so the same args resolve once per render pass.
 *   - Errors go through console.error + null/[]; Server Components
 *     degrade gracefully instead of throwing.
 *
 * Visibility filters match the listings public_read_live_listings
 * RLS policy:
 *   status='live' AND fraud_status NOT IN ('held','rejected')
 *     AND soft_deleted_at IS NULL
 *
 * Hero imagery: consumed from the same rows as the feed (see
 * app/[locale]/page.tsx). One query, one source of truth.
 */

// ---------------------------------------------------------------------------
// Sub-category → feed-bucket mapping
// ---------------------------------------------------------------------------

/**
 * Flat lookup keyed on the listing's SUB-category slug (e.g.
 * 'used-cars', 'phones-tablets'). Used instead of a 2-level
 * self-referential parent join in the SELECT — PostgREST's behaviour
 * with `parent:categories!categories_parent_id_fkey(slug)` on a
 * self-FK turned out to be unreliable. Keeping the bucket resolution
 * in app code is explicit, fast, and one less thing for the DB to
 * trip on.
 *
 * When a new vertical seeds listings, append its sub-cat slugs here.
 * Unknown slugs fall through to 'tech' as a catch-all so newly-seeded
 * verticals don't silently disappear from the feed before they get
 * their own bucket.
 */
const SUB_CAT_TO_BUCKET: Readonly<Record<string, FeedCategoryKey>> = {
  // Automotive family — all 15 automotive sub-cats map to 'cars'.
  'used-cars': 'cars',
  'new-cars': 'cars',
  'classic-cars': 'cars',
  'junk-cars': 'cars',
  'wanted-cars': 'cars',
  motorcycles: 'cars',
  watercraft: 'cars',
  cmvs: 'cars',
  'auto-spare-parts': 'cars',
  'auto-accessories': 'cars',
  'auto-services': 'cars',
  dealerships: 'cars',
  'car-garages': 'cars',
  'car-rental-business': 'cars',
  'food-trucks': 'cars',
  // Real-estate family (Phase 4a) — 8 sub-cats → 'property'.
  'property-for-sale': 'property',
  'property-for-rent': 'property',
  'property-for-exchange': 'property',
  'rooms-for-rent': 'property',
  land: 'property',
  'international-property': 'property',
  'property-management': 'property',
  'realestate-offices': 'property',
  // Electronics family (Phase 7 v2) — 6 sub-cats → 'tech'.
  'phones-tablets': 'tech',
  'laptops-computers': 'tech',
  'tvs-audio': 'tech',
  gaming: 'tech',
  'smart-watches': 'tech',
  cameras: 'tech',
  // Future: jobs sub-cats — add when seeded.
};

function toFeedCategory(
  subCategorySlug: string | null | undefined,
): FeedCategoryKey {
  // Default fallback is 'jobs' — the only remaining bucket that lacks
  // its own vertical detail page. When an unmapped sub-cat appears in
  // the feed, routing through verticalPathForFeedCat lands it on the
  // locale root rather than falsely claiming it's an electronics SKU.
  if (!subCategorySlug) return 'jobs';
  return SUB_CAT_TO_BUCKET[subCategorySlug] ?? 'jobs';
}

// ---------------------------------------------------------------------------
// Meta derivation
// ---------------------------------------------------------------------------

/**
 * Tiny spec line derived from the JSONB category_fields. Kept simple
 * and generic:
 *   automotive   → {year · mileage_km}
 *   electronics  → {storage_gb · battery_health_pct · cosmetic_grade}
 *                  (falls back to any subset — won't emit an empty line)
 *   everything else → undefined (card shows title + price + location only)
 */
function deriveMeta(fields: unknown): string | undefined {
  if (!fields || typeof fields !== 'object') return undefined;
  const f = fields as Record<string, unknown>;
  const parts: string[] = [];

  // Automotive signals
  if (typeof f.year === 'number') parts.push(String(f.year));
  if (typeof f.mileage_km === 'number') {
    parts.push(
      f.mileage_km === 0
        ? '0 km'
        : `${(f.mileage_km as number).toLocaleString('en-US')} km`,
    );
  }

  // Electronics signals (additive — a listing will only ever carry one
  // family of fields at a time, but we check both defensively).
  if (typeof f.storage_gb === 'number' && f.storage_gb > 0) {
    parts.push(
      f.storage_gb >= 1000
        ? `${(f.storage_gb as number) / 1000}TB`
        : `${f.storage_gb}GB`,
    );
  }
  if (
    typeof f.battery_health_pct === 'number' &&
    f.battery_health_pct > 0 &&
    f.battery_health_pct <= 100
  ) {
    parts.push(`${f.battery_health_pct}%`);
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
}

// ---------------------------------------------------------------------------
// Select + raw row shape
// ---------------------------------------------------------------------------

const FEED_SELECT = `
  id, slug, title, price_minor_units, currency_code, old_price_minor_units,
  is_featured, created_at, published_at, category_fields,
  seller:profiles!listings_seller_id_fkey (
    display_name, dealer_name, is_dealer, dealer_verified_at
  ),
  city:cities!listings_city_id_fkey (name_ar, name_en),
  category:categories!listings_category_id_fkey (slug),
  listing_images!inner (url, position)
` as const;

interface RawFeedRow {
  id: number;
  slug: string;
  title: string;
  price_minor_units: number | string;
  currency_code: string;
  old_price_minor_units: number | string | null;
  is_featured: boolean;
  created_at: string;
  published_at: string | null;
  category_fields: unknown;
  seller: {
    display_name: string;
    dealer_name: string | null;
    is_dealer: boolean;
    dealer_verified_at: string | null;
  } | null;
  city: { name_ar: string; name_en: string } | null;
  category: { slug: string } | null;
  listing_images: { url: string; position: number }[] | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickCityName(
  city: { name_ar: string; name_en: string } | null,
  locale: 'ar' | 'en',
): string {
  if (!city) return '';
  return locale === 'ar' ? city.name_ar : city.name_en;
}

function coverUrl(images: { url: string; position: number }[] | null): string | null {
  if (!images || images.length === 0) return null;
  const sorted = images.slice().sort((a, b) => a.position - b.position);
  return sorted[0]?.url ?? null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapFeedRow(row: RawFeedRow, locale: 'ar' | 'en'): FeedListing | null {
  const cover = coverUrl(row.listing_images);
  if (!cover) return null; // filter out listings without an image

  const price = Number(row.price_minor_units);
  const oldPriceRaw =
    row.old_price_minor_units === null ? null : Number(row.old_price_minor_units);
  const kind: FeedListing['kind'] = oldPriceRaw != null ? 'pricedrop' : 'listing';

  const drop =
    oldPriceRaw != null && oldPriceRaw > 0
      ? Math.round(((price - oldPriceRaw) / oldPriceRaw) * 100)
      : undefined;

  const dealer =
    row.seller?.dealer_name?.trim() || row.seller?.display_name || '';

  const verified =
    (row.seller?.is_dealer ?? false) &&
    Boolean(row.seller?.dealer_verified_at);

  return {
    kind,
    id: row.id,
    slug: row.slug,
    cat: toFeedCategory(row.category?.slug ?? null),
    title: row.title,
    meta: deriveMeta(row.category_fields),
    price: formatPrice(price, row.currency_code, locale),
    oldPrice:
      oldPriceRaw != null
        ? formatPrice(oldPriceRaw, row.currency_code, locale)
        : undefined,
    drop,
    loc: pickCityName(row.city, locale),
    dealer,
    verified,
    featured: row.is_featured,
    image: cover,
    ts: new Date(row.created_at).getTime(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Most recent live listings across all categories. Serves as the
 * single source of truth for the Landing page — the hero image
 * scatters (Feature283) and the rolling feed (LiveFeed) both
 * derive from this result, so the listings teased at the top are
 * literally the same ones surfaced below.
 *
 * Rows without a cover image are skipped. Price-drop rows
 * (`old_price_minor_units IS NOT NULL`) get `kind='pricedrop'` +
 * a negative `drop` percent.
 *
 * @example
 *   // Over-fetch so pickBalancedHero can keep the hero cross-vertical
 *   // even if a single vertical has a recent seed burst. See the
 *   // 2026-04-22 regression docstring on pickBalancedHero for history.
 *   const feed = await getLiveFeedListings({ limit: 18, locale: 'ar' });
 *   const heroImages = pickBalancedHero(feed, 6).map(...); // Feature283
 *   const initialFeed = feed.slice(0, 8);                  // LiveFeed
 */
export const getLiveFeedListings = cache(
  async function getLiveFeedListings(
    opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<FeedListing[]> {
    const limit = opts.limit ?? 12;
    const supabase = createClient();

    // Order by published_at (story-time), not created_at (row-insert
    // time). Before 2026-04-22 these were nearly identical so ordering
    // by either worked; that day, migration 0035 re-seeded 8 electronics
    // listings at NOW() and the `created_at` order swept the top 18,
    // dropping every car out of the landing feed + hero pool. `published_at`
    // reflects the INTERVAL offsets the seeds intentionally spread across,
    // which is the semantic we actually want for "newest listings".
    const { data, error } = await supabase
      .from('listings')
      .select(FEED_SELECT)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error(
        '[landing/queries] getLiveFeedListings error:',
        error.message,
      );
      return [];
    }
    if (!data) return [];

    return (data as unknown as RawFeedRow[])
      .map((row) => mapFeedRow(row, opts.locale))
      .filter((x): x is FeedListing => x !== null);
  },
);

// pickBalancedHero has moved to ./types (pure-function file, no React
// cache() dependency — lets vitest import it without the server-side
// supabase transitive dep). Re-exported here for consumer convenience.
export { pickBalancedHero } from './types';
