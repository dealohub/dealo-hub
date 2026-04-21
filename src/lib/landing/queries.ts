import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/format';
import type {
  FeedCategoryKey,
  FeedListing,
  HeroImage,
} from './types';

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
 */

// ---------------------------------------------------------------------------
// Parent-category → feed-bucket mapping
// ---------------------------------------------------------------------------

/**
 * The feed UI exposes 4 buckets; the DB has 21 parent categories
 * (TAXONOMY-V2). Unknown parents fall through to 'tech' as a
 * catch-all so new verticals don't silently disappear from the feed
 * before they get their own bucket.
 */
const PARENT_TO_BUCKET: Record<string, FeedCategoryKey> = {
  automotive: 'cars',
  'real-estate': 'property',
  electronics: 'tech',
  jobs: 'jobs',
};

function toFeedCategory(parentSlug: string | null | undefined): FeedCategoryKey {
  if (!parentSlug) return 'tech';
  return PARENT_TO_BUCKET[parentSlug] ?? 'tech';
}

// ---------------------------------------------------------------------------
// Meta derivation
// ---------------------------------------------------------------------------

/**
 * Tiny spec line derived from the JSONB category_fields. Kept simple
 * and generic — automotive surfaces {year · mileage}; non-automotive
 * returns undefined (the card shows only title + price + location).
 */
function deriveMeta(fields: unknown): string | undefined {
  if (!fields || typeof fields !== 'object') return undefined;
  const f = fields as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof f.year === 'number') parts.push(String(f.year));
  if (typeof f.mileage_km === 'number') {
    parts.push(
      f.mileage_km === 0
        ? '0 km'
        : `${(f.mileage_km as number).toLocaleString('en-US')} km`,
    );
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

// ---------------------------------------------------------------------------
// Selects + raw row shapes
// ---------------------------------------------------------------------------

const FEED_SELECT = `
  id, title, price_minor_units, currency_code, old_price_minor_units,
  is_featured, created_at, category_fields,
  seller:profiles!listings_seller_id_fkey (
    display_name, dealer_name, is_dealer, dealer_verified_at
  ),
  city:cities!listings_city_id_fkey (name_ar, name_en),
  category:categories!listings_category_id_fkey (
    slug,
    parent:categories!categories_parent_id_fkey (slug)
  ),
  listing_images (url, position)
` as const;

interface RawFeedRow {
  id: number;
  title: string;
  price_minor_units: number | string;
  currency_code: string;
  old_price_minor_units: number | string | null;
  is_featured: boolean;
  created_at: string;
  category_fields: unknown;
  seller: {
    display_name: string;
    dealer_name: string | null;
    is_dealer: boolean;
    dealer_verified_at: string | null;
  } | null;
  city: { name_ar: string; name_en: string } | null;
  category: {
    slug: string;
    parent: { slug: string } | null;
  } | null;
  listing_images: { url: string; position: number }[] | null;
}

const HERO_SELECT = `
  id, title,
  listing_images (url, position)
` as const;

interface RawHeroRow {
  id: number;
  title: string;
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
    cat: toFeedCategory(row.category?.parent?.slug ?? null),
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
 * Most recent live listings across all categories for the Landing
 * `LiveFeed`. Rows without a cover image are skipped. Price-drop
 * rows (`old_price_minor_units IS NOT NULL`) are tagged with
 * `kind='pricedrop'` so the feed can render them with the
 * strike-through treatment.
 *
 * @example
 *   const initialFeed = await getLiveFeedListings({ limit: 8, locale: 'ar' });
 */
export const getLiveFeedListings = cache(
  async function getLiveFeedListings(
    opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<FeedListing[]> {
    const limit = opts.limit ?? 8;
    const supabase = createClient();

    const { data, error } = await supabase
      .from('listings')
      .select(FEED_SELECT)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .order('created_at', { ascending: false })
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

/**
 * Fetches up to `limit` cover images for the Feature283 hero
 * scatters. Rows without an image are skipped. Newest first.
 *
 * @example
 *   const heroImages = await getHeroListings({ limit: 6, locale: 'ar' });
 */
export const getHeroListings = cache(async function getHeroListings(
  opts: { limit?: number; locale?: 'ar' | 'en' } = { locale: 'ar' },
): Promise<HeroImage[]> {
  const limit = opts.limit ?? 6;
  const supabase = createClient();

  const { data, error } = await supabase
    .from('listings')
    .select(HERO_SELECT)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[landing/queries] getHeroListings error:', error.message);
    return [];
  }
  if (!data) return [];

  return (data as unknown as RawHeroRow[])
    .map((row): HeroImage | null => {
      const src = coverUrl(row.listing_images);
      return src ? { src, alt: row.title } : null;
    })
    .filter((x): x is HeroImage => x !== null);
});
