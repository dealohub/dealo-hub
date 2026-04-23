import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { VerificationTier, VerificationMethod } from '@/lib/properties/types';

/**
 * Generic listing detail query.
 *
 * The Rides and Properties verticals have their own dedicated detail
 * pages (`/rides/[slug]`, `/properties/[slug]`) with vertical-specific
 * field renderers. But Dealo Hub has 8 sub-categories — electronics,
 * fashion, home goods, collectibles, etc. — that don't warrant their
 * own vertical yet. Before this module they had NO detail page at
 * all: publishing redirected to `/` and SearchResultCard href
 * fell back to `/`. Buyers saw a card but couldn't open it.
 *
 * This query gives us a vertical-agnostic shape that the generic
 * `/listings/[slug]` page renders. It mirrors the Rides/Properties
 * shape closely enough that a consumer who wants to unify the UX
 * later can map between them 1:1, but it deliberately omits the
 * `category_fields` depth: those belong to vertical-specific pages.
 *
 * Reference: supply-loop completion gap flagged 2026-04-21.
 */

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

export interface GenericListingImage {
  url: string;
  position: number;
  width: number;
  height: number;
  altText: string | null;
}

export interface GenericListingDetail {
  // Identity
  id: number;
  slug: string;

  // Taxonomy
  categorySlug: string;
  categoryName: string; // locale-picked

  // Bilingual text (fallback-aware)
  title: string;
  description: string;

  // Commercial
  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  oldPriceMinorUnits: number | null;
  priceMode: 'fixed' | 'negotiable' | 'best_offer';
  minOfferMinorUnits: number | null;

  // Condition + brand/model
  condition: string;
  brand: string | null;
  model: string | null;

  // Verification + flags
  verificationTier: VerificationTier;
  verifiedAt: string | null;
  verifiedBy: VerificationMethod | null;
  isFeatured: boolean;
  isHot: boolean;

  // Seller mini-card
  seller: {
    id: string;
    displayName: string;
    handle: string | null;
    avatarUrl: string | null;
    isDealer: boolean;
    dealerName: string | null;
    ratingAvg: number | null;
    ratingCount: number | null;
    createdAt: string;
  };

  // Location
  cityName: string;
  areaName: string | null;

  // Delivery
  deliveryOptions: string[];

  // Media
  images: GenericListingImage[];
  videoUrl: string | null;

  // Counters
  viewCount: number;
  saveCount: number;
  chatInitiationCount: number;

  // Lifecycle
  createdAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
}

// ---------------------------------------------------------------------------
// SELECT string
// ---------------------------------------------------------------------------

const DETAIL_SELECT = `
  id, slug, title, title_ar, title_en, description, description_ar, description_en,
  brand, model, condition,
  price_mode, price_minor_units, currency_code, min_offer_minor_units,
  old_price_minor_units, is_featured, is_hot,
  verification_tier, verified_at, verified_by,
  view_count, save_count, chat_initiation_count,
  delivery_options,
  video_url,
  created_at, published_at, expires_at,
  listing_images ( url, position, width, height, alt_text ),
  seller:profiles!listings_seller_id_fkey (
    id, display_name, handle, avatar_url,
    rating_avg, rating_count,
    is_dealer, dealer_name, dealer_verified_at,
    created_at
  ),
  city:cities!listings_city_id_fkey ( name_ar, name_en ),
  area:areas!listings_area_id_fkey ( name_ar, name_en ),
  category:categories!listings_category_id_fkey ( slug, name_ar, name_en )
` as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function isNumericInput(v: string | number): boolean {
  if (typeof v === 'number') return true;
  return /^\d+$/.test(v);
}

/**
 * Fetch a listing by slug (or numeric id) for the generic detail page.
 *
 * Returns `null` when:
 *   • Row not found
 *   • Listing is not live (status != 'live' OR fraud held/rejected OR soft-deleted)
 *
 * The RLS policy `public_read_live_listings` handles the visibility
 * rule already — we include the explicit filters for defence-in-depth
 * and to surface a clean 404 from the detail page.
 */
export const getGenericListingBySlug = cache(
  async function getGenericListingBySlug(
    slugOrId: string | number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<GenericListingDetail | null> {
    const supabase = await createClient();
    const filterKey = isNumericInput(slugOrId) ? 'id' : 'slug';

    const { data, error } = await supabase
      .from('listings')
      .select(DETAIL_SELECT)
      .eq(filterKey, slugOrId)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error(
        '[listings/detail-queries] getGenericListingBySlug(%s) error: %s',
        slugOrId,
        error.message,
      );
      return null;
    }
    if (!data) return null;

    return mapGeneric(data as any, opts.locale);
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickLocale(
  row: {
    name_ar?: string | null;
    name_en?: string | null;
  } | null,
  locale: 'ar' | 'en',
): string {
  if (!row) return '';
  return locale === 'ar'
    ? row.name_ar ?? row.name_en ?? ''
    : row.name_en ?? row.name_ar ?? '';
}

function pickTitle(
  row: { title: string; title_ar: string | null; title_en: string | null },
  locale: 'ar' | 'en',
): string {
  if (locale === 'ar') return row.title_ar ?? row.title_en ?? row.title;
  return row.title_en ?? row.title_ar ?? row.title;
}

function pickDescription(
  row: {
    description: string;
    description_ar: string | null;
    description_en: string | null;
  },
  locale: 'ar' | 'en',
): string {
  if (locale === 'ar')
    return row.description_ar ?? row.description_en ?? row.description;
  return row.description_en ?? row.description_ar ?? row.description;
}

function toNumberOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function mapGeneric(row: any, locale: 'ar' | 'en'): GenericListingDetail {
  const images: GenericListingImage[] = (row.listing_images ?? [])
    .slice()
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => ({
      url: img.url,
      position: img.position,
      width: img.width,
      height: img.height,
      altText: img.alt_text,
    }));

  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.category?.slug ?? '',
    categoryName: pickLocale(row.category, locale),
    title: pickTitle(row, locale),
    description: pickDescription(row, locale),
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code as GenericListingDetail['currencyCode'],
    oldPriceMinorUnits: toNumberOrNull(row.old_price_minor_units),
    priceMode: row.price_mode,
    minOfferMinorUnits: toNumberOrNull(row.min_offer_minor_units),
    condition: row.condition,
    brand: row.brand,
    model: row.model,
    verificationTier: row.verification_tier,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    isFeatured: row.is_featured,
    isHot: row.is_hot,
    seller: {
      id: row.seller?.id ?? '',
      displayName: row.seller?.display_name ?? '—',
      handle: row.seller?.handle ?? null,
      avatarUrl: row.seller?.avatar_url ?? null,
      isDealer: row.seller?.is_dealer ?? false,
      dealerName: row.seller?.dealer_name ?? null,
      ratingAvg: row.seller?.rating_avg ?? null,
      ratingCount: row.seller?.rating_count ?? null,
      createdAt: row.seller?.created_at ?? new Date().toISOString(),
    },
    cityName: pickLocale(row.city, locale),
    areaName: row.area ? pickLocale(row.area, locale) : null,
    deliveryOptions: (row.delivery_options ?? []) as string[],
    images,
    videoUrl: row.video_url ?? null,
    viewCount: row.view_count,
    saveCount: row.save_count,
    chatInitiationCount: row.chat_initiation_count,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}
