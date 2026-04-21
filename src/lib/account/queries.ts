import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ListingCardData } from '@/lib/browse/types';

/**
 * Account-scoped queries.
 *
 * Both getMyListings + getSavedListings run as the signed-in user; RLS
 * + the explicit user_id filter narrow to the caller's rows.
 *
 * Shape: both emit ListingCardData so the UI can reuse SearchResultCard
 * (or future hub cards) without a dedicated card per surface.
 */

function mapRow(row: any, locale: 'ar' | 'en'): ListingCardData {
  const images = (row.listing_images ?? []).sort(
    (a: any, b: any) => a.position - b.position,
  );
  const cover = images[0];
  return {
    id: row.id as number,
    title: row.title as string,
    priceMode: row.price_mode,
    priceMinorUnits:
      typeof row.price_minor_units === 'string'
        ? Number(row.price_minor_units)
        : (row.price_minor_units as number),
    currencyCode: row.currency_code as string,
    minOfferMinorUnits:
      row.min_offer_minor_units == null
        ? null
        : typeof row.min_offer_minor_units === 'string'
          ? Number(row.min_offer_minor_units)
          : (row.min_offer_minor_units as number),
    coverUrl: cover?.medium_url ?? cover?.url ?? null,
    imageCount: images.length,
    hasVideo: (row.listing_videos?.length ?? 0) > 0,
    areaName: row.areas
      ? (locale === 'ar' ? row.areas.name_ar : row.areas.name_en)
      : null,
    cityName: row.cities
      ? (locale === 'ar' ? row.cities.name_ar : row.cities.name_en)
      : null,
    createdAt: row.created_at as string,
    saveCount: row.save_count as number,
    categorySlug: row.category?.slug ?? null,
    isAuthenticityConfirmed: !!row.authenticity_confirmed,
    seller: {
      id: row.profiles?.id ?? '',
      displayName: row.profiles?.display_name ?? '—',
      handle: row.profiles?.handle ?? null,
      avatarUrl: row.profiles?.avatar_url ?? null,
      isPhoneVerified: !!row.profiles?.phone_verified_at,
    },
  };
}

const CARD_SELECT = `
  id, title, price_minor_units, currency_code, price_mode, min_offer_minor_units,
  country_code, created_at, save_count, authenticity_confirmed, status,
  listing_images ( url, thumb_url, medium_url, position ),
  listing_videos ( id ),
  profiles:seller_id ( id, display_name, handle, avatar_url, phone_verified_at ),
  cities:city_id ( id, name_ar, name_en ),
  areas:area_id ( id, name_ar, name_en ),
  category:categories!listings_category_id_fkey ( slug, name_ar, name_en )
`;

export interface MyListingRow extends ListingCardData {
  status:
    | 'draft'
    | 'live'
    | 'archived'
    | 'deleted'
    | 'sold'
    | 'held'
    | 'rejected';
}

/**
 * Listings where the signed-in user is the seller. Includes non-live
 * statuses (draft/archived/sold/held) so sellers see their full
 * inventory and can manage state.
 */
export const getMyListings = cache(
  async function getMyListings(
    locale: 'ar' | 'en' = 'ar',
  ): Promise<MyListingRow[]> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .eq('seller_id', user.id)
      .is('soft_deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      if (error) console.error('[account/queries] getMyListings error:', error.message);
      return [];
    }

    return (data as any[]).map(row => ({
      ...mapRow(row, locale),
      status: row.status as MyListingRow['status'],
    }));
  },
);

/**
 * Listings the signed-in user has saved (favorited).
 */
export const getSavedListings = cache(
  async function getSavedListings(
    locale: 'ar' | 'en' = 'ar',
  ): Promise<ListingCardData[]> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch favorite listing_ids ordered by most-recently-saved
    const { data: favs } = await supabase
      .from('favorites')
      .select('listing_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!favs || favs.length === 0) return [];

    const listingIds = favs.map(f => f.listing_id);

    const { data: listings, error } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .in('id', listingIds)
      .eq('status', 'live')
      .neq('fraud_status', 'rejected')
      .is('soft_deleted_at', null);

    if (error || !listings) {
      if (error) console.error('[account/queries] getSavedListings error:', error.message);
      return [];
    }

    // Preserve favorite-added-at ordering
    const orderMap = new Map(listingIds.map((id, i) => [id, i]));
    return (listings as any[])
      .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
      .map(row => mapRow(row, locale));
  },
);
