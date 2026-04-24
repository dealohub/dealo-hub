import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  validateElectronicsFieldsRawV2,
  toElectronicsFields,
  type ElectronicsFields,
} from './validators';
import type {
  ElectronicsDetail,
  ElectronicsCard,
  ElectronicsCategoryKey,
  ElectronicsImage,
  ElectronicsImageCategory,
  DeviceKind,
} from './types';
import { isElectronicsSubCat } from './types';
import type { VerificationTier, VerificationMethod } from '@/lib/properties/types';

/**
 * Read-side queries for the Electronics vertical (v2).
 *
 * Mirrors the shape of src/lib/properties/queries.ts — same RLS-
 * respecting client, same React `cache()` de-dup, same mapper
 * convention (snake_case DB → camelCase consumer).
 *
 * Public queries:
 *   - getElectronicsBySlug(slugOrId, locale?) → detail page
 *   - getSimilarElectronics(listingId, limit, locale?) → similar strip
 *   - getElectronicsCatalogSearch(query, subCat?, limit?) → wizard autocomplete
 *   - getElectronicsCatalogBySlug(slug) → wizard & detail lookup
 *   - getFeaturedElectronics(locale, limit?) → hub featured strip (Commit 3)
 *   - getElectronicsForGrid(locale, opts?) → hub main grid (Commit 3)
 *   - getElectronicsSubCatCounts() → hub type tiles (Commit 3)
 *
 * Reference: planning/PHASE-7A-ELECTRONICS-V2.md §3 (schema) + §5 (tiers)
 */

// ---------------------------------------------------------------------------
// SELECT strings — mirror property detail depth
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
  country_code,
  listing_images ( url, position ),
  city:cities!listings_city_id_fkey ( name_ar, name_en ),
  area:areas!listings_area_id_fkey ( name_ar, name_en ),
  category:categories!listings_category_id_fkey ( slug )
` as const;

// ---------------------------------------------------------------------------
// Image-category allowlist
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

function asImageCategory(v: string | null): ElectronicsImageCategory | null {
  if (v === null) return null;
  return (ELECTRONICS_IMAGE_CATEGORIES as ReadonlyArray<string>).includes(v)
    ? (v as ElectronicsImageCategory)
    : null;
}

// ---------------------------------------------------------------------------
// Locale pickers (mirror properties/queries.ts helpers)
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
  return locale === 'ar' ? row.name_ar ?? row.name_en ?? '' : row.name_en ?? row.name_ar ?? '';
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

  const validation = validateElectronicsFieldsRawV2(row.category_fields, subCatSlug);
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
    countryCode: row.country_code ?? 'KW',
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

  const validation = validateElectronicsFieldsRawV2(row.category_fields, subCatSlug);
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
    cosmeticGrade: f.cosmeticGrade,
    batteryHealthPct: f.batteryHealthPct ?? null,
    purchaseSource: f.purchaseSource,
    acceptsTrade: !!f.acceptsTrade,
    cityName: pickLocalised(row.city, locale),
    areaName: row.area ? pickLocalised(row.area, locale) : null,
    countryCode: row.country_code ?? 'KW',
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public API — detail + similar
// ---------------------------------------------------------------------------

export const getElectronicsBySlug = cache(
  async function getElectronicsBySlug(
    slugOrId: string | number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<ElectronicsDetail | null> {
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
    const supabase = await createClient();

    // Pull the source row's category + brand to anchor the similarity
    const { data: src } = await supabase
      .from('listings')
      .select('category_id, brand, category_fields')
      .eq('id', listingId)
      .maybeSingle();
    if (!src) return [];

    const srcCatId = (src as any).category_id as number;
    const srcBrand = ((src as any).brand as string | null) ?? '';

    // Step 1 — same sub-cat + same brand (tight)
    let { data: rows } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .eq('category_id', srcCatId)
      .eq('brand', srcBrand || '__none__')
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .neq('id', listingId)
      .order('published_at', { ascending: false })
      .limit(limit);

    // Loose fallback — same sub-cat, any brand
    if (!rows || rows.length < limit) {
      const { data: fb } = await supabase
        .from('listings')
        .select(CARD_SELECT)
        .eq('category_id', srcCatId)
        .eq('status', 'live')
        .not('fraud_status', 'in', '(held,rejected)')
        .is('soft_deleted_at', null)
        .neq('id', listingId)
        .order('published_at', { ascending: false })
        .limit(limit);
      rows = fb ?? rows ?? [];
    }

    return ((rows as any[]) ?? [])
      .map(r => mapCard(r, opts.locale))
      .filter((x): x is ElectronicsCard => x !== null);
  },
);

// ---------------------------------------------------------------------------
// Device catalog (v2 — new)
// ---------------------------------------------------------------------------

export interface DeviceCatalogRow {
  slug: string;
  brand: string;
  model: string;
  deviceKind: DeviceKind;
  storageGb: number | null;
  ramGb: number | null;
  screenSizeInches: number | null;
  releaseYear: number | null;
  launchPriceMinorUnits: number | null;
  displayName: string;
  subCat: ElectronicsCategoryKey;
}

function mapCatalogRow(row: any): DeviceCatalogRow {
  return {
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    deviceKind: row.device_kind as DeviceKind,
    storageGb: row.storage_gb ?? null,
    ramGb: row.ram_gb ?? null,
    screenSizeInches: row.screen_size_inches ? Number(row.screen_size_inches) : null,
    releaseYear: row.release_year ?? null,
    launchPriceMinorUnits: row.launch_price_minor_units
      ? Number(row.launch_price_minor_units)
      : null,
    displayName: row.display_name,
    subCat: row.sub_cat as ElectronicsCategoryKey,
  };
}

/**
 * Wizard autocomplete — search by brand/model/display_name prefix.
 * Filtered to active rows + (optionally) to a single sub-cat.
 */
export async function getElectronicsCatalogSearch(
  query: string,
  subCat?: ElectronicsCategoryKey,
  limit = 20,
): Promise<DeviceCatalogRow[]> {
  const trimmed = query.trim();
  const supabase = await createClient();

  let q = supabase
    .from('electronics_device_catalog')
    .select(
      'slug, brand, model, device_kind, storage_gb, ram_gb, screen_size_inches, release_year, launch_price_minor_units, display_name, sub_cat',
    )
    .eq('is_active', true);

  if (subCat) q = q.eq('sub_cat', subCat);

  if (trimmed) {
    // Case-insensitive contains on display_name OR brand OR model.
    // Supabase OR syntax: column.ilike.%pattern%,other_column.ilike.%pattern%
    const safe = trimmed.replace(/[%_]/g, ''); // strip ILIKE meta chars
    q = q.or(
      `display_name.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`,
    );
  }

  const { data, error } = await q
    .order('release_year', { ascending: false, nullsFirst: false })
    .order('display_name', { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error('[electronics/queries] catalog search error:', error?.message);
    return [];
  }
  return (data as any[]).map(mapCatalogRow);
}

/** Single-row lookup — used by detail + listing creation verification. */
export const getElectronicsCatalogBySlug = cache(
  async function getElectronicsCatalogBySlug(
    slug: string,
  ): Promise<DeviceCatalogRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('electronics_device_catalog')
      .select(
        'slug, brand, model, device_kind, storage_gb, ram_gb, screen_size_inches, release_year, launch_price_minor_units, display_name, sub_cat',
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    return mapCatalogRow(data as any);
  },
);

// ---------------------------------------------------------------------------
// Hub queries (shipped here, consumed by Commit 3's /tech page)
// ---------------------------------------------------------------------------

export const getFeaturedElectronics = cache(
  async function getFeaturedElectronics(
    opts: { locale: 'ar' | 'en'; limit?: number } = { locale: 'ar' },
  ): Promise<ElectronicsCard[]> {
    const supabase = await createClient();
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
      excludeIds?: number[];
    } = { locale: 'ar' },
  ): Promise<ElectronicsCard[]> {
    const supabase = await createClient();

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

    let q = supabase
      .from('listings')
      .select(CARD_SELECT)
      .in('category_id', categoryIds)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null);
    if (opts.excludeIds && opts.excludeIds.length > 0) {
      q = q.not('id', 'in', `(${opts.excludeIds.join(',')})`);
    }
    const { data } = await q
      .order('published_at', { ascending: false })
      .limit(opts.limit ?? 24);

    return ((data as any[]) ?? [])
      .map(r => mapCard(r, opts.locale))
      .filter((x): x is ElectronicsCard => x !== null);
  },
);

// ---------------------------------------------------------------------------
// Recent activity — LiveFeed strip on the hub
// ---------------------------------------------------------------------------
//
// Mirrors getRecentPropertyActivity. Returns the latest N published
// electronics listings with a synthetic `event` label so the LiveFeed
// component can render a mix of "new / inspected / price_drop / trade"
// pills without needing a real event stream.
//
// Event derivation precedence (same as Properties):
//   price_drop (old_price_minor_units set)
//   → inspected (dealo_inspected tier)
//   → trade (accepts_trade true — surfaces P8 badal at discovery)
//   → featured (is_featured)
//   → new (default)

export interface ElectronicsActivityItem {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  cityName: string;
  areaName: string | null;
  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  brand: string;
  model: string;
  deviceKind: DeviceKind;
  storageGb: number | null;
  batteryHealthPct: number | null;
  acceptsTrade: boolean;
  subCat: ElectronicsCategoryKey;
  verificationTier: VerificationTier;
  event: 'new' | 'price_drop' | 'inspected' | 'featured' | 'trade';
  createdAt: string;
}

export const getRecentElectronicsActivity = cache(
  async function getRecentElectronicsActivity(
    opts: { limit?: number; locale: 'ar' | 'en'; excludeIds?: number[] } = {
      locale: 'ar',
    },
  ): Promise<ElectronicsActivityItem[]> {
    const limit = opts.limit ?? 12;
    const supabase = await createClient();

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

    let q = supabase
      .from('listings')
      .select(CARD_SELECT + ', is_hot, old_price_minor_units')
      .in('category_id', ids)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null);
    if (opts.excludeIds && opts.excludeIds.length > 0) {
      q = q.not('id', 'in', `(${opts.excludeIds.join(',')})`);
    }
    const { data, error } = await q
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      if (error)
        console.error(
          '[electronics/queries] getRecentElectronicsActivity error:',
          error.message,
        );
      return [];
    }

    return (data as any[])
      .map(row => {
        const subCatSlug = row.category?.slug;
        if (!isElectronicsSubCat(subCatSlug)) return null;
        const validation = validateElectronicsFieldsRawV2(
          row.category_fields,
          subCatSlug,
        );
        if (!validation.success) return null;
        const f = toElectronicsFields(validation.data);

        const cover =
          (row.listing_images ?? [])
            .slice()
            .sort((a: any, b: any) => a.position - b.position)[0]?.url ?? null;

        const hasPriceDrop = row.old_price_minor_units != null;
        const event: ElectronicsActivityItem['event'] = hasPriceDrop
          ? 'price_drop'
          : row.verification_tier === 'dealo_inspected'
            ? 'inspected'
            : f.acceptsTrade
              ? 'trade'
              : row.is_featured
                ? 'featured'
                : 'new';

        return {
          id: row.id as number,
          slug: row.slug as string,
          title: pickTitle(row, opts.locale),
          cover,
          cityName: pickLocalised(row.city, opts.locale),
          areaName: row.area ? pickLocalised(row.area, opts.locale) : null,
          priceMinorUnits: Number(row.price_minor_units),
          currencyCode: row.currency_code as ElectronicsActivityItem['currencyCode'],
          brand: f.brand,
          model: f.model,
          deviceKind: f.deviceKind,
          storageGb: f.storageGb ?? null,
          batteryHealthPct: f.batteryHealthPct ?? null,
          acceptsTrade: !!f.acceptsTrade,
          subCat: subCatSlug,
          verificationTier: row.verification_tier as VerificationTier,
          event,
          createdAt: row.created_at as string,
        } satisfies ElectronicsActivityItem;
      })
      .filter((x): x is ElectronicsActivityItem => x !== null);
  },
);

export async function getElectronicsSubCatCounts(): Promise<
  Record<ElectronicsCategoryKey, number>
> {
  const supabase = await createClient();
  const parent = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'electronics')
    .single();

  const zero: Record<ElectronicsCategoryKey, number> = {
    'phones-tablets': 0,
    'laptops-computers': 0,
    'tvs-audio': 0,
    gaming: 0,
    'smart-watches': 0,
    cameras: 0,
  };
  if (!parent.data?.id) return zero;

  const subs = await supabase
    .from('categories')
    .select('id, slug')
    .eq('parent_id', parent.data.id);

  const slugByCatId = new Map<number, ElectronicsCategoryKey>();
  for (const s of (subs.data ?? []) as Array<{ id: number; slug: string }>) {
    if (isElectronicsSubCat(s.slug)) slugByCatId.set(s.id, s.slug);
  }
  if (slugByCatId.size === 0) return zero;

  const { data: rows } = await supabase
    .from('listings')
    .select('category_id')
    .in('category_id', Array.from(slugByCatId.keys()))
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null);

  for (const r of (rows ?? []) as Array<{ category_id: number }>) {
    const slug = slugByCatId.get(r.category_id);
    if (slug) zero[slug] += 1;
  }
  return zero;
}
