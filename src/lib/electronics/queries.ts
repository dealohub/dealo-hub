import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  validateElectronicsFieldsRaw,
  toElectronicsFields,
  type ElectronicsFields,
} from './validators';
import type {
  ElectronicsDetail,
  ElectronicsCard,
  ElectronicsCategoryKey,
  ElectronicsImage,
  ElectronicsImageCategory,
} from './types';
import { isElectronicsSubCat } from './types';
import type {
  VerificationTier,
  VerificationMethod,
} from '@/lib/properties/types';

/**
 * Read-side queries for the Electronics vertical.
 *
 * Conventions mirror src/lib/properties/queries.ts:
 *   - createClient() (RLS-respecting)
 *   - React cache() wrapper for single-pass de-dup
 *   - Errors log + return null/[]
 *   - Mappers convert snake_case → camelCase ElectronicsDetail/Card
 *
 * Visibility: matches public_read_live_listings RLS policy
 *   status='live' AND fraud_status NOT IN ('held','rejected')
 *     AND soft_deleted_at IS NULL
 *
 * Similar-electronics algorithm (P-no-direct-pillar): same sub_cat +
 * same brand + matching device_kind, ordered by recency. Falls back
 * to same-sub_cat-only if too few hits.
 */

// ---------------------------------------------------------------------------
// SELECT strings
// ---------------------------------------------------------------------------

const DETAIL_SELECT = `
  id, slug, title, title_ar, title_en, description, description_ar, description_en,
  brand, model,
  condition, price_mode, price_minor_units, currency_code, min_offer_minor_units,
  old_price_minor_units, is_featured, is_hot,
  verification_tier, verified_at, verified_by,
  view_count, save_count, chat_initiation_count,
  country_code, city_id, area_id, status, published_at, expires_at,
  created_at, category_fields,
  listing_images ( url, width, height, alt_text, position, category ),
  seller:profiles!listings_seller_id_fkey (
    id, display_name, handle, avatar_url,
    rating_avg, rating_count,
    is_dealer, dealer_name, dealer_verified_at,
    created_at
  ),
  city:cities!listings_city_id_fkey ( id, name_ar, name_en ),
  area:areas!listings_area_id_fkey ( id, name_ar, name_en ),
  category:categories!listings_category_id_fkey ( id, slug, name_ar, name_en )
` as const;

const CARD_SELECT = `
  id, slug, title, title_ar, title_en, brand, model,
  price_mode, price_minor_units, currency_code, old_price_minor_units,
  is_featured, verification_tier, created_at, category_fields,
  listing_images ( url, position ),
  city:cities!listings_city_id_fkey ( name_ar, name_en ),
  area:areas!listings_area_id_fkey ( name_ar, name_en ),
  category:categories!listings_category_id_fkey ( slug )
` as const;

// ---------------------------------------------------------------------------
// Image categories (Phase 7a defined these — listing_images.category check
// hasn't been extended for the new electronics-specific values yet, so we
// pass through the existing 'details' / 'exterior' / 'interior' values.)
// ---------------------------------------------------------------------------

const ELECTRONICS_IMAGE_CATEGORIES: ReadonlyArray<ElectronicsImageCategory> = [
  'power_on_screen',
  'imei_screen',
  'battery_health_screen',
  'serial_label',
  'exterior',
  'interior',
  'details',
];

function asImageCategory(
  value: string | null,
): ElectronicsImageCategory | null {
  if (value === null) return null;
  return (ELECTRONICS_IMAGE_CATEGORIES as ReadonlyArray<string>).includes(value)
    ? (value as ElectronicsImageCategory)
    : null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNumericInput(input: string | number): boolean {
  if (typeof input === 'number') return true;
  return /^\d+$/.test(input);
}

function pickLocalised(
  row: { name_ar?: string | null; name_en?: string | null } | null,
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
  row: { description: string; description_ar: string | null; description_en: string | null },
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

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapDetail(row: any, locale: 'ar' | 'en'): ElectronicsDetail | null {
  const subCatSlug = row.category?.slug as string | undefined;
  if (!isElectronicsSubCat(subCatSlug)) {
    console.error(
      '[electronics/queries] listing %s is not an electronics sub-cat: %s',
      row.id,
      subCatSlug,
    );
    return null;
  }

  const validation = validateElectronicsFieldsRaw(row.category_fields, subCatSlug);
  if (!validation.success) {
    console.error(
      '[electronics/queries] category_fields validation failed for listing %s: %s',
      row.id,
      validation.error.message,
    );
    return null;
  }
  const fields: ElectronicsFields = toElectronicsFields(validation.data);

  const images: ElectronicsImage[] = (row.listing_images ?? [])
    .slice()
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => ({
      url: img.url,
      width: img.width,
      height: img.height,
      altText: img.alt_text,
      position: img.position,
      category: asImageCategory(img.category),
    }));

  return {
    id: row.id,
    slug: row.slug,
    subCat: subCatSlug,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    title: pickTitle(row, locale),
    description: pickDescription(row, locale),
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code as ElectronicsDetail['currencyCode'],
    oldPriceMinorUnits: toNumberOrNull(row.old_price_minor_units),
    isPriceNegotiable:
      row.price_mode === 'negotiable' || row.price_mode === 'best_offer',
    verificationTier: row.verification_tier as VerificationTier,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by as VerificationMethod | null,
    isFeatured: row.is_featured,
    isHot: row.is_hot,
    fields,
    seller: {
      id: row.seller?.id ?? '',
      displayName: row.seller?.display_name ?? '—',
      handle: row.seller?.handle ?? null,
      avatarUrl: row.seller?.avatar_url ?? null,
      isDealer: row.seller?.is_dealer ?? false,
      dealerName: row.seller?.dealer_name ?? null,
      dealerVerifiedAt: row.seller?.dealer_verified_at ?? null,
      ratingAvg: row.seller?.rating_avg ?? null,
      ratingCount: row.seller?.rating_count ?? null,
      createdAt: row.seller?.created_at ?? new Date().toISOString(),
    },
    cityId: row.city?.id ?? row.city_id,
    cityName: pickLocalised(row.city, locale),
    areaId: row.area_id,
    areaName: row.area ? pickLocalised(row.area, locale) : null,
    images,
    viewCount: row.view_count,
    saveCount: row.save_count,
    chatInitiationCount: row.chat_initiation_count,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

function mapCard(row: any, locale: 'ar' | 'en'): ElectronicsCard | null {
  const subCatSlug = row.category?.slug as string | undefined;
  if (!isElectronicsSubCat(subCatSlug)) return null;

  const validation = validateElectronicsFieldsRaw(row.category_fields, subCatSlug);
  if (!validation.success) return null;
  const f = toElectronicsFields(validation.data);

  const cover =
    (row.listing_images ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)[0]?.url ?? null;

  return {
    id: row.id,
    slug: row.slug,
    subCat: subCatSlug,
    title: pickTitle(row, locale),
    cover,
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code as ElectronicsCard['currencyCode'],
    oldPriceMinorUnits: toNumberOrNull(row.old_price_minor_units),
    isPriceNegotiable:
      row.price_mode === 'negotiable' || row.price_mode === 'best_offer',
    verificationTier: row.verification_tier as VerificationTier,
    brand: f.brand,
    model: f.model,
    deviceKind: f.deviceKind,
    storageGb: f.storageGb ?? null,
    conditionGrade: f.conditionGrade,
    batteryHealthPct: f.batteryHealthPct ?? null,
    warrantyStatus: f.warrantyStatus,
    cityName: pickLocalised(row.city, locale),
    areaName: row.area ? pickLocalised(row.area, locale) : null,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getElectronicsBySlug = cache(
  async function getElectronicsBySlug(
    slugOrId: string | number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<ElectronicsDetail | null> {
    const supabase = createClient();
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
        '[electronics/queries] getElectronicsBySlug(%s) error: %s',
        slugOrId,
        error.message,
      );
      return null;
    }
    if (!data) return null;
    return mapDetail(data as any, opts.locale);
  },
);

export const getSimilarElectronics = cache(
  async function getSimilarElectronics(
    listingId: number,
    limit: number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<ElectronicsCard[]> {
    const supabase = createClient();

    // Step 1 — fetch source listing's sub-cat + brand for the algo.
    const { data: src } = await supabase
      .from('listings')
      .select('category_id, brand, category_fields')
      .eq('id', listingId)
      .maybeSingle();
    if (!src) return [];

    const srcCatId = (src as any).category_id as number;
    const srcBrand = (src as any).brand as string | null;

    // Step 2 — same sub-cat + same brand. Fall back to same sub-cat
    // only if too few results.
    let { data: rows } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .eq('category_id', srcCatId)
      .eq('brand', srcBrand ?? '__none__')
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .neq('id', listingId)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (!rows || rows.length < limit) {
      const { data: fallback } = await supabase
        .from('listings')
        .select(CARD_SELECT)
        .eq('category_id', srcCatId)
        .eq('status', 'live')
        .not('fraud_status', 'in', '(held,rejected)')
        .is('soft_deleted_at', null)
        .neq('id', listingId)
        .order('published_at', { ascending: false })
        .limit(limit);
      rows = fallback ?? rows ?? [];
    }

    return ((rows as any[]) ?? [])
      .map(r => mapCard(r, opts.locale))
      .filter((x): x is ElectronicsCard => x !== null);
  },
);

// ---------------------------------------------------------------------------
// Hub queries (for Phase 7d)
// ---------------------------------------------------------------------------

export const getFeaturedElectronics = cache(
  async function getFeaturedElectronics(
    opts: { locale: 'ar' | 'en'; limit?: number } = { locale: 'ar' },
  ): Promise<ElectronicsCard[]> {
    const supabase = createClient();
    const parent = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'electronics')
      .single();
    if (!parent.data?.id) return [];

    const kids = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', parent.data.id);
    const ids = (kids.data ?? []).map((c: any) => c.id);
    if (ids.length === 0) return [];

    const { data } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .in('category_id', ids)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .order('verification_tier', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(opts.limit ?? 6);

    return ((data as any[]) ?? [])
      .map(r => mapCard(r, opts.locale))
      .filter((x): x is ElectronicsCard => x !== null);
  },
);

export const getElectronicsForGrid = cache(
  async function getElectronicsForGrid(
    opts: {
      locale: 'ar' | 'en';
      limit?: number;
      subCat?: ElectronicsCategoryKey;
    } = { locale: 'ar' },
  ): Promise<ElectronicsCard[]> {
    const supabase = createClient();

    // Resolve target category ids (parent + filtered sub).
    const parent = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'electronics')
      .single();
    if (!parent.data?.id) return [];

    let categoryIds: number[];
    if (opts.subCat) {
      const sub = await supabase
        .from('categories')
        .select('id')
        .eq('slug', opts.subCat)
        .eq('parent_id', parent.data.id)
        .single();
      if (!sub.data?.id) return [];
      categoryIds = [sub.data.id];
    } else {
      const kids = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', parent.data.id);
      categoryIds = (kids.data ?? []).map((c: any) => c.id);
    }
    if (categoryIds.length === 0) return [];

    const { data } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .in('category_id', categoryIds)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(opts.limit ?? 24);

    return ((data as any[]) ?? [])
      .map(r => mapCard(r, opts.locale))
      .filter((x): x is ElectronicsCard => x !== null);
  },
);

/** Counts per sub-cat — drives the "Browse by type" tile counts on the hub. */
export async function getElectronicsSubCatCounts(): Promise<
  Record<ElectronicsCategoryKey, number>
> {
  const supabase = createClient();
  const parent = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'electronics')
    .single();
  if (!parent.data?.id) {
    return {
      'phones-tablets': 0,
      'laptops-computers': 0,
      'tvs-audio': 0,
      gaming: 0,
      'smart-watches': 0,
      cameras: 0,
    };
  }

  const subs = await supabase
    .from('categories')
    .select('id, slug')
    .eq('parent_id', parent.data.id);

  const slugByCatId = new Map<number, ElectronicsCategoryKey>();
  for (const s of (subs.data ?? []) as Array<{ id: number; slug: string }>) {
    if (isElectronicsSubCat(s.slug)) slugByCatId.set(s.id, s.slug);
  }

  const out: Record<ElectronicsCategoryKey, number> = {
    'phones-tablets': 0,
    'laptops-computers': 0,
    'tvs-audio': 0,
    gaming: 0,
    'smart-watches': 0,
    cameras: 0,
  };

  if (slugByCatId.size === 0) return out;

  const { data: rows } = await supabase
    .from('listings')
    .select('category_id')
    .in('category_id', Array.from(slugByCatId.keys()))
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null);

  for (const r of (rows ?? []) as Array<{ category_id: number }>) {
    const slug = slugByCatId.get(r.category_id);
    if (slug) out[slug] += 1;
  }
  return out;
}
