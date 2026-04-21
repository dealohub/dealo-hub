import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_PAGE_SIZE,
  type FilterState,
  type ListingCardData,
} from './types';

/**
 * Shape of the joined row we select for browse/search pages.
 * Kept narrow — phone + email must NEVER be in this projection (Decision 2).
 */
const LISTING_CARD_SELECT = `
  id, title, price_minor_units, currency_code, price_mode, min_offer_minor_units,
  country_code, created_at, save_count, authenticity_confirmed, category_id,
  listing_images ( url, thumb_url, medium_url, position ),
  listing_videos ( id ),
  profiles:seller_id ( id, display_name, handle, avatar_url, phone_verified_at ),
  cities:city_id ( id, name_ar, name_en ),
  areas:area_id ( id, name_ar, name_en ),
  category:categories!listings_category_id_fkey ( slug, name_ar, name_en )
` as const;

interface RawListingRow {
  id: number;
  title: string;
  price_minor_units: number | string;
  currency_code: string;
  price_mode: 'fixed' | 'negotiable' | 'best_offer';
  min_offer_minor_units: number | string | null;
  country_code: string;
  created_at: string;
  save_count: number;
  authenticity_confirmed: boolean;
  category_id: number;
  listing_images: { url: string; thumb_url: string | null; medium_url: string | null; position: number }[] | null;
  listing_videos: { id: number }[] | null;
  profiles: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    phone_verified_at: string | null;
  } | null;
  cities: { id: number; name_ar: string; name_en: string } | null;
  areas: { id: number; name_ar: string; name_en: string } | null;
  category: { slug: string; name_ar: string; name_en: string } | null;
}

export interface ListingQueryResult {
  rows: ListingCardData[];
  total: number;
}

function mapRow(row: RawListingRow, locale: 'ar' | 'en'): ListingCardData {
  const images = (row.listing_images ?? []).sort((a, b) => a.position - b.position);
  const cover = images[0];
  const city = row.cities;
  const area = row.areas;
  const profile = row.profiles;

  return {
    id: row.id,
    title: row.title,
    priceMode: row.price_mode,
    priceMinorUnits: typeof row.price_minor_units === 'string'
      ? BigInt(row.price_minor_units)
      : row.price_minor_units,
    currencyCode: row.currency_code,
    minOfferMinorUnits:
      row.min_offer_minor_units == null
        ? null
        : typeof row.min_offer_minor_units === 'string'
          ? BigInt(row.min_offer_minor_units)
          : row.min_offer_minor_units,
    coverUrl: cover?.medium_url ?? cover?.url ?? null,
    imageCount: images.length,
    hasVideo: (row.listing_videos?.length ?? 0) > 0,
    areaName: area ? (locale === 'ar' ? area.name_ar : area.name_en) : null,
    cityName: city ? (locale === 'ar' ? city.name_ar : city.name_en) : null,
    createdAt: row.created_at,
    saveCount: row.save_count,
    categorySlug: row.category?.slug ?? null,
    isAuthenticityConfirmed: row.authenticity_confirmed,
    seller: {
      id: profile?.id ?? '',
      displayName: profile?.display_name ?? '—',
      handle: profile?.handle ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isPhoneVerified: !!profile?.phone_verified_at,
    },
  };
}

/**
 * Fetches listings filtered + sorted per `FilterState`, paginated.
 * Always scoped to `status='live'` + `fraud_status!='rejected'` (Decision 11).
 */
export async function getFilteredListings(
  filters: FilterState,
  opts: { locale: 'ar' | 'en'; pageSize?: number; categoryId?: number; subcategoryId?: number } = {
    locale: 'ar',
  }
): Promise<ListingQueryResult> {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const supabase = createClient();

  let query = supabase
    .from('listings')
    .select(LISTING_CARD_SELECT, { count: 'exact' })
    .eq('status', 'live')
    .neq('fraud_status', 'rejected')
    .is('soft_deleted_at', null);

  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts.subcategoryId) query = query.eq('subcategory_id', opts.subcategoryId);
  if (filters.priceMin != null) query = query.gte('price_minor_units', filters.priceMin);
  if (filters.priceMax != null) query = query.lte('price_minor_units', filters.priceMax);
  if (filters.cityId) query = query.eq('city_id', filters.cityId);
  if (filters.areaIds?.length) query = query.in('area_id', filters.areaIds);
  if (filters.conditions?.length) query = query.in('condition', filters.conditions);
  if (filters.priceModes?.length) query = query.in('price_mode', filters.priceModes);
  if (filters.deliveryOptions?.length) {
    query = query.overlaps('delivery_options', filters.deliveryOptions);
  }
  if (filters.hasDocumentation) query = query.eq('has_receipt', true);

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price_minor_units', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_minor_units', { ascending: false });
      break;
    case 'most_saved':
      query = query.order('save_count', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const offset = Math.max(0, (filters.page - 1) * pageSize);
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error || !data) {
    console.error('[browse/queries] getFilteredListings error:', error?.message);
    return { rows: [], total: 0 };
  }

  let rows = (data as unknown as RawListingRow[]).map(row => mapRow(row, opts.locale));

  // Post-filter for properties that can't be expressed server-side cleanly.
  if (filters.hasVideo) rows = rows.filter(r => r.hasVideo);
  if (filters.sellerPhoneVerified) rows = rows.filter(r => r.seller.isPhoneVerified);

  return { rows, total: count ?? rows.length };
}

/** Listings shown in "Featured" strips on the home marketplace. */
export async function getFeaturedListings(
  opts: { locale: 'ar' | 'en'; limit?: number; categoryId?: number } = { locale: 'ar' }
): Promise<ListingCardData[]> {
  const supabase = createClient();
  let query = supabase
    .from('listings')
    .select(LISTING_CARD_SELECT)
    .eq('status', 'live')
    .neq('fraud_status', 'rejected')
    .is('soft_deleted_at', null)
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 6);

  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as unknown as RawListingRow[]).map(row => mapRow(row, opts.locale));
}

/** Listing IDs the signed-in user has favorited — batched for grid rendering. */
export async function getSavedListingIdSet(listingIds: number[]): Promise<Set<number>> {
  if (listingIds.length === 0) return new Set();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
    .in('listing_id', listingIds);

  if (error || !data) return new Set();
  return new Set(data.map(r => r.listing_id));
}
