import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { UsedCarFieldsSchema } from './validators';
import type {
  ImageCategory,
  RideCard,
  RideDetail,
  RideImage,
  RideSeller,
} from './types';

/**
 * Read-side queries for the rides (automotive) vertical.
 *
 * Conventions:
 *   - `createClient()` from `@/lib/supabase/server` (RLS-respecting).
 *   - `cache()` wraps each function so a single server-render pass
 *     doesn't re-hit the DB for the same args.
 *   - Errors logged via console.error; return null / [] instead of
 *     throwing so Server Components can render notFound() / empty state.
 *   - Mappers convert the DB snake_case row into the app-facing
 *     camelCase shape (RideDetail / RideCard). No snake_case leaks
 *     out of this file.
 *
 * Visibility filters (match the listings `public_read_live_listings`
 * RLS policy):
 *   status='live' AND fraud_status NOT IN ('held','rejected')
 *     AND soft_deleted_at IS NULL
 */

// ---------------------------------------------------------------------------
// SELECT strings
// ---------------------------------------------------------------------------

const DETAIL_SELECT = `
  id, slug, title, description, brand, model, color,
  condition, price_mode, price_minor_units, currency_code, min_offer_minor_units,
  old_price_minor_units, is_featured, is_hot,
  view_count, save_count, chat_initiation_count,
  country_code, city_id, status, published_at, category_fields,
  listing_images ( url, width, height, alt_text, position, category ),
  seller:profiles!listings_seller_id_fkey (
    id, display_name, handle, avatar_url,
    rating_avg, rating_count,
    is_dealer, dealer_name, dealer_verified_at,
    created_at
  ),
  city:cities!listings_city_id_fkey ( id, name_ar, name_en ),
  category:categories!listings_category_id_fkey ( id, slug, name_ar, name_en )
` as const;

const CARD_SELECT = `
  id, slug, title, brand, model, price_minor_units, currency_code,
  category_fields,
  listing_images ( url, position ),
  city:cities!listings_city_id_fkey ( name_ar, name_en ),
  category:categories!listings_category_id_fkey ( slug )
` as const;

// ---------------------------------------------------------------------------
// Raw row shapes (match the SELECT strings above)
// ---------------------------------------------------------------------------

interface RawDetailRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  condition: RideDetail['condition'];
  price_mode: RideDetail['priceMode'];
  price_minor_units: number | string;
  currency_code: string;
  min_offer_minor_units: number | string | null;
  old_price_minor_units: number | string | null;
  is_featured: boolean;
  is_hot: boolean;
  view_count: number;
  save_count: number;
  chat_initiation_count: number;
  country_code: string;
  city_id: number;
  status: RideDetail['status'];
  published_at: string | null;
  category_fields: unknown;
  listing_images:
    | {
        url: string;
        width: number;
        height: number;
        alt_text: string | null;
        position: number;
        category: string | null;
      }[]
    | null;
  seller: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    rating_avg: number | null;
    rating_count: number;
    is_dealer: boolean;
    dealer_name: string | null;
    dealer_verified_at: string | null;
    created_at: string;
  } | null;
  city: {
    id: number;
    name_ar: string;
    name_en: string;
  } | null;
  category: {
    id: number;
    slug: string;
    name_ar: string;
    name_en: string;
  } | null;
}

interface RawCardRow {
  id: number;
  slug: string;
  title: string;
  brand: string | null;
  model: string | null;
  price_minor_units: number | string;
  currency_code: string;
  category_fields: unknown;
  listing_images: { url: string; position: number }[] | null;
  city: { name_ar: string; name_en: string } | null;
  category: { slug: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IMAGE_CATEGORIES: readonly ImageCategory[] = [
  'exterior',
  'interior',
  'engine',
  'wheels',
  'details',
];

function isNumericInput(input: string | number): boolean {
  if (typeof input === 'number') return true;
  return /^\d+$/.test(input);
}

function pickCityName(
  city: { name_ar: string; name_en: string } | null,
  locale: 'ar' | 'en',
): string {
  if (!city) return '';
  return locale === 'ar' ? city.name_ar : city.name_en;
}

/**
 * Maps a sub-category slug to the UI tint used for badges, chip dots,
 * and ambient glows on rides cards + detail pages. Temporary: expand
 * this table as new automotive sub-categories gain distinct visual
 * treatment. Default falls through to the generic cars red.
 */
export function getRideCatColor(
  subCategorySlug: string | null | undefined,
): string {
  if (!subCategorySlug) return '#ef4444';
  switch (subCategorySlug) {
    case 'motorcycles':
      return '#f59e0b';
    case 'watercraft':
      return '#0ea5e9';
    case 'cmvs':
    case 'food-trucks':
      return '#78716c';
    default:
      return '#ef4444';
  }
}

/** Coerces a nullable string-or-number BIGINT into a number (or null). */
function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return Number(value);
}

/** Full integer years since the given ISO date. */
function yearsSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  if (!isFinite(then) || now <= then) return 0;
  const ms = now - then;
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
}

/** Safe cast to ImageCategory — falls back to null for unknown / missing. */
function asImageCategory(value: string | null): ImageCategory | null {
  if (value === null) return null;
  return (IMAGE_CATEGORIES as readonly string[]).includes(value)
    ? (value as ImageCategory)
    : null;
}

// ---------------------------------------------------------------------------
// Mappers — snake_case row → camelCase app shape (stays inside this file)
// ---------------------------------------------------------------------------

function mapDetail(row: RawDetailRow, locale: 'ar' | 'en'): RideDetail | null {
  // Validate + transform the JSONB to camelCase via Zod
  const specsResult = UsedCarFieldsSchema.safeParse(row.category_fields);
  if (!specsResult.success) {
    console.error(
      '[rides/queries] category_fields validation failed for listing %s: %s',
      row.id,
      specsResult.error.message,
    );
    return null;
  }

  const images: RideImage[] = (row.listing_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(img => ({
      url: img.url,
      width: img.width,
      height: img.height,
      altText: img.alt_text,
      position: img.position,
      category: asImageCategory(img.category),
    }));

  const seller: RideSeller = {
    id: row.seller?.id ?? '',
    displayName: row.seller?.display_name ?? '—',
    handle: row.seller?.handle ?? null,
    avatarUrl: row.seller?.avatar_url ?? null,
    ratingAvg: row.seller?.rating_avg ?? null,
    ratingCount: row.seller?.rating_count ?? 0,
    isDealer: row.seller?.is_dealer ?? false,
    dealerName: row.seller?.dealer_name ?? null,
    dealerVerifiedAt: row.seller?.dealer_verified_at ?? null,
    yearsActive: row.seller ? yearsSince(row.seller.created_at) : 0,
  };

  const catColor = getRideCatColor(row.category?.slug);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    brand: row.brand,
    model: row.model,
    color: row.color,
    condition: row.condition,
    priceMode: row.price_mode,
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code,
    minOfferMinorUnits: toNumberOrNull(row.min_offer_minor_units),
    oldPriceMinorUnits: toNumberOrNull(row.old_price_minor_units),
    countryCode: row.country_code,
    cityId: row.city_id,
    cityName: pickCityName(row.city, locale),
    status: row.status,
    publishedAt: row.published_at,
    isFeatured: row.is_featured,
    isHot: row.is_hot,
    viewCount: row.view_count,
    saveCount: row.save_count,
    chatInitiationCount: row.chat_initiation_count,
    specs: specsResult.data,
    images,
    seller,
    category: row.category
      ? {
          id: row.category.id,
          slug: row.category.slug,
          nameAr: row.category.name_ar,
          nameEn: row.category.name_en,
        }
      : { id: 0, slug: '', nameAr: '', nameEn: '' },
    catColor,
  };
}

function mapCard(row: RawCardRow, locale: 'ar' | 'en'): RideCard {
  const cover = (row.listing_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)[0];

  // Shallow read of category_fields — avoid full Zod parse (cheaper + tolerant).
  const fields =
    row.category_fields && typeof row.category_fields === 'object'
      ? (row.category_fields as Record<string, unknown>)
      : {};

  const year = typeof fields.year === 'number' ? fields.year : null;
  const bodyStyle =
    typeof fields.body_style === 'string' ? fields.body_style : null;
  const fuelType =
    typeof fields.fuel_type === 'string' ? fields.fuel_type : null;
  const mileageKm =
    typeof fields.mileage_km === 'number' ? fields.mileage_km : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    model: row.model,
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code,
    coverImage: cover?.url ?? null,
    cityName: pickCityName(row.city, locale),
    year,
    bodyStyle,
    fuelType,
    mileageKm,
    subCategorySlug: row.category?.slug ?? '',
    catColor: getRideCatColor(row.category?.slug),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches a single ride's full detail by numeric id or slug.
 * Returns null on miss or validation failure — caller renders notFound().
 *
 * @example
 *   const ride = await getRideById('bmw-m5-competition-2024-7');
 *   const ride = await getRideById(7);
 */
export const getRideById = cache(async function getRideById(
  idOrSlug: string | number,
  opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<RideDetail | null> {
  const supabase = createClient();

  const column = isNumericInput(idOrSlug) ? 'id' : 'slug';
  const value = column === 'id' ? Number(idOrSlug) : String(idOrSlug);

  const { data, error } = await supabase
    .from('listings')
    .select(DETAIL_SELECT)
    .eq(column, value)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[rides/queries] getRideById error:', error.message);
    return null;
  }
  if (!data) return null;

  return mapDetail(data as unknown as RawDetailRow, opts.locale);
});

/**
 * Fetches up to `limit` listings in the same sub-category as the given
 * listing, sorted by closest price.
 *
 * Dynamic category: the function looks up the input listing's
 * `category_id` and filters siblings by the same value, so it works
 * for any rides sub-category (used-cars, motorcycles, watercraft, …)
 * without hardcoding.
 *
 * @example
 *   const similar = await getSimilarRides(listingId, 4);
 */
export const getSimilarRides = cache(async function getSimilarRides(
  listingId: number,
  limit: number = 4,
  opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<RideCard[]> {
  const supabase = createClient();

  // Step 1: look up the input listing's category + price for distance sort.
  const { data: current, error: currentErr } = await supabase
    .from('listings')
    .select('category_id, price_minor_units')
    .eq('id', listingId)
    .maybeSingle();

  if (currentErr) {
    console.error(
      '[rides/queries] getSimilarRides lookup error:',
      currentErr.message,
    );
    return [];
  }
  if (!current) return [];

  // Step 2: fetch live siblings in the same sub-category, excluding self.
  const { data, error } = await supabase
    .from('listings')
    .select(CARD_SELECT)
    .eq('category_id', current.category_id)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null)
    .neq('id', listingId);

  if (error) {
    console.error(
      '[rides/queries] getSimilarRides candidates error:',
      error.message,
    );
    return [];
  }
  if (!data || data.length === 0) return [];

  const currentPrice = Number(current.price_minor_units);

  // Closest-price sort in JS (small candidate sets — migrate to RPC
  // if this ever exceeds a few hundred rows per category).
  const sorted = (data as unknown as RawCardRow[])
    .map(row => ({
      row,
      diff: Math.abs(Number(row.price_minor_units) - currentPrice),
    }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, Math.max(0, limit));

  return sorted.map(({ row }) => mapCard(row, opts.locale));
});

// ---------------------------------------------------------------------------
// Hub helpers — used by /rides page queries
// ---------------------------------------------------------------------------

/**
 * Looks up the ids of all sub-categories under the `automotive` parent.
 * Cached for the render pass so featured + grid + counts share one DB hit.
 */
const getAutomotiveSubCategoryIds = cache(async function getAutomotiveSubCategoryIds(): Promise<number[]> {
  const supabase = createClient();

  const { data: parent, error: parentErr } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'automotive')
    .maybeSingle();

  if (parentErr) {
    console.error(
      '[rides/queries] automotive parent lookup error:',
      parentErr.message,
    );
    return [];
  }
  if (!parent) return [];

  const { data: subs, error: subsErr } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', parent.id)
    .eq('is_active', true);

  if (subsErr) {
    console.error(
      '[rides/queries] automotive sub-cats lookup error:',
      subsErr.message,
    );
    return [];
  }
  return (subs ?? []).map((c) => c.id);
});

// ---------------------------------------------------------------------------
// /rides hub queries
// ---------------------------------------------------------------------------

/**
 * Paid-placement listings for the `RidesFeaturedPremium` row.
 * Fetches automotive listings where `is_featured = true`, sorted by
 * hot-first then newest. Capped at `limit` (default 4 — matches the
 * fixed 4-col grid).
 */
export const getFeaturedRides = cache(async function getFeaturedRides(
  opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<RideCard[]> {
  const limit = opts.limit ?? 4;
  const subIds = await getAutomotiveSubCategoryIds();
  if (subIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('listings')
    .select(CARD_SELECT)
    .in('category_id', subIds)
    .eq('is_featured', true)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null)
    .order('is_hot', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[rides/queries] getFeaturedRides error:', error.message);
    return [];
  }
  if (!data) return [];

  return (data as unknown as RawCardRow[]).map((row) =>
    mapCard(row, opts.locale),
  );
});

/**
 * Sort keys accepted by the main browse grid.
 *   - newest      → created_at DESC
 *   - priceAsc    → price_minor_units ASC
 *   - priceDesc   → price_minor_units DESC
 *   - popular     → save_count DESC, view_count DESC
 *   - relevance   → is_hot DESC, created_at DESC  (default)
 */
export type RidesGridSort =
  | 'newest'
  | 'priceAsc'
  | 'priceDesc'
  | 'popular'
  | 'relevance';

/**
 * Main-grid listings with sort + optional sub-category filter.
 *
 * When `subCategorySlug` is omitted, excludes `is_featured=true` rows
 * (the featured row already displays them). When a slug is provided,
 * includes everything in that sub-cat — same behaviour as the
 * seed-driven hub this replaces.
 *
 * Returns `total` via Supabase `count: 'exact'` so the progress bar
 * stays accurate.
 */
export const getRidesForGrid = cache(async function getRidesForGrid(params: {
  subCategorySlug?: string;
  sortBy?: RidesGridSort;
  limit: number;
  offset: number;
  locale: 'ar' | 'en';
}): Promise<{ items: RideCard[]; total: number }> {
  const supabase = createClient();
  const sortBy = params.sortBy ?? 'relevance';

  // Resolve the target category ids — either a single sub-cat or
  // every automotive sub-cat.
  let categoryIds: number[];
  if (params.subCategorySlug) {
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.subCategorySlug)
      .maybeSingle();
    if (catErr) {
      console.error(
        '[rides/queries] getRidesForGrid sub-cat lookup error:',
        catErr.message,
      );
      return { items: [], total: 0 };
    }
    if (!cat) return { items: [], total: 0 };
    categoryIds = [cat.id];
  } else {
    categoryIds = await getAutomotiveSubCategoryIds();
    if (categoryIds.length === 0) return { items: [], total: 0 };
  }

  let query = supabase
    .from('listings')
    .select(CARD_SELECT, { count: 'exact' })
    .in('category_id', categoryIds)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null);

  // "All" view excludes featured (shown above the grid separately).
  if (!params.subCategorySlug) {
    query = query.eq('is_featured', false);
  }

  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'priceAsc':
      query = query.order('price_minor_units', { ascending: true });
      break;
    case 'priceDesc':
      query = query.order('price_minor_units', { ascending: false });
      break;
    case 'popular':
      query = query
        .order('save_count', { ascending: false })
        .order('view_count', { ascending: false });
      break;
    case 'relevance':
    default:
      query = query
        .order('is_hot', { ascending: false })
        .order('created_at', { ascending: false });
      break;
  }

  const start = Math.max(0, params.offset);
  const end = start + Math.max(1, params.limit) - 1;
  query = query.range(start, end);

  const { data, count, error } = await query;
  if (error) {
    console.error('[rides/queries] getRidesForGrid error:', error.message);
    return { items: [], total: 0 };
  }
  if (!data) return { items: [], total: count ?? 0 };

  const items = (data as unknown as RawCardRow[]).map((row) =>
    mapCard(row, params.locale),
  );
  return { items, total: count ?? items.length };
});

/**
 * Live counts per automotive sub-category for the hub filter chips.
 * Only sub-categories with `count > 0` are returned — the UI avoids
 * rendering chips that lead to empty result sets.
 */
export const getRideTypeCounts = cache(async function getRideTypeCounts(
  _opts: { locale?: 'ar' | 'en' } = {},
): Promise<
  Array<{ slug: string; nameAr: string; nameEn: string; count: number }>
> {
  const supabase = createClient();

  const { data: parent, error: parentErr } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'automotive')
    .maybeSingle();
  if (parentErr) {
    console.error(
      '[rides/queries] getRideTypeCounts parent error:',
      parentErr.message,
    );
    return [];
  }
  if (!parent) return [];

  const { data: subs, error: subsErr } = await supabase
    .from('categories')
    .select('id, slug, name_ar, name_en, sort_order')
    .eq('parent_id', parent.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (subsErr) {
    console.error(
      '[rides/queries] getRideTypeCounts subs error:',
      subsErr.message,
    );
    return [];
  }
  if (!subs || subs.length === 0) return [];

  const subIds = subs.map((s) => s.id);

  // One query returns a category_id per live listing across all
  // automotive sub-cats; we aggregate in JS. Cheaper than 15 parallel
  // count(*) queries and avoids defining an RPC for V1.
  const { data: listings, error: listingsErr } = await supabase
    .from('listings')
    .select('category_id')
    .in('category_id', subIds)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null);
  if (listingsErr) {
    console.error(
      '[rides/queries] getRideTypeCounts listings error:',
      listingsErr.message,
    );
    return [];
  }

  const counts = new Map<number, number>();
  for (const row of listings ?? []) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return subs
    .map((s) => ({
      slug: s.slug,
      nameAr: s.name_ar,
      nameEn: s.name_en,
      count: counts.get(s.id) ?? 0,
    }))
    .filter((x) => x.count > 0);
});
