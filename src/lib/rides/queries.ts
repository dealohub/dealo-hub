import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { UsedCarFieldsSchema } from './validators';
import type { RideCard, RideDetail, RideImage, RideSeller } from './types';

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
  country_code, city_id, status, published_at, category_fields,
  listing_images ( url, width, height, alt_text, position ),
  seller:profiles!listings_seller_id_fkey (
    id, display_name, handle, avatar_url,
    rating_avg, rating_count,
    is_dealer, dealer_name, dealer_verified_at
  ),
  city:cities!listings_city_id_fkey ( id, name_ar, name_en ),
  category:categories!listings_category_id_fkey ( id, slug, name_ar, name_en )
` as const;

const CARD_SELECT = `
  id, slug, title, brand, model, price_minor_units, currency_code,
  category_fields,
  listing_images ( url, position ),
  city:cities!listings_city_id_fkey ( name_ar, name_en )
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  };

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
    minOfferMinorUnits:
      row.min_offer_minor_units === null
        ? null
        : Number(row.min_offer_minor_units),
    countryCode: row.country_code,
    cityId: row.city_id,
    cityName: pickCityName(row.city, locale),
    status: row.status,
    publishedAt: row.published_at,
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
 *   const ride = await getRideById('bmw-m5-competition-2024-2');
 *   const ride = await getRideById(2);
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
