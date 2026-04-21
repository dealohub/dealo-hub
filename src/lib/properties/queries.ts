import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  validatePropertyFieldsRaw,
  toPropertyFields,
  deriveOwnershipEligibility,
  type PropertyFields,
} from './validators';
import type {
  PropertyDetail,
  PropertyCard,
  PropertyCategoryKey,
  PropertyImage,
  PropertyImageCategory,
  VerificationTier,
  VerificationMethod,
} from './types';
import { purposeFromSubCat } from './types';

/**
 * Read-side queries for the Properties vertical.
 *
 * Conventions mirror src/lib/rides/queries.ts:
 *   - createClient() from @/lib/supabase/server (RLS-respecting).
 *   - React cache() wrapper — single server-render pass resolves args once.
 *   - Errors log to console, return null / [] instead of throwing.
 *   - Mappers convert snake_case DB rows → camelCase PropertyDetail /
 *     PropertyCard. No snake_case leaks from this file.
 *
 * Visibility filters match the listings public_read_live_listings
 * RLS policy:
 *   status='live' AND fraud_status NOT IN ('held','rejected')
 *     AND soft_deleted_at IS NULL
 *
 * Similar-properties algorithm (P9 direction): same sub_cat + same city
 * + matching property_type, ordered by recency. No algorithmic price
 * estimator — just a structural neighbourhood match.
 */

// ---------------------------------------------------------------------------
// SELECT strings
// ---------------------------------------------------------------------------

const DETAIL_SELECT = `
  id, slug, title, title_ar, title_en, description, description_ar, description_en,
  brand, model, color,
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
// Raw row shapes (match the SELECT strings above)
// ---------------------------------------------------------------------------

interface RawDetailRow {
  id: number;
  slug: string;
  title: string;
  title_ar: string | null;
  title_en: string | null;
  description: string;
  description_ar: string | null;
  description_en: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  condition: string;
  price_mode: 'fixed' | 'negotiable' | 'best_offer';
  price_minor_units: number | string;
  currency_code: string;
  min_offer_minor_units: number | string | null;
  old_price_minor_units: number | string | null;
  is_featured: boolean;
  is_hot: boolean;
  verification_tier: VerificationTier;
  verified_at: string | null;
  verified_by: VerificationMethod | null;
  view_count: number;
  save_count: number;
  chat_initiation_count: number;
  country_code: string;
  city_id: number;
  area_id: number | null;
  status: string;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
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
  area: {
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
  title_ar: string | null;
  title_en: string | null;
  brand: string | null;
  model: string | null;
  price_mode: 'fixed' | 'negotiable' | 'best_offer';
  price_minor_units: number | string;
  currency_code: string;
  old_price_minor_units: number | string | null;
  is_featured: boolean;
  verification_tier: VerificationTier;
  created_at: string;
  category_fields: unknown;
  listing_images: { url: string; position: number }[] | null;
  city: { name_ar: string; name_en: string } | null;
  area: { name_ar: string; name_en: string } | null;
  category: { slug: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IMAGE_CATEGORIES: readonly PropertyImageCategory[] = [
  'building_exterior',
  'living_room',
  'bedroom',
  'kitchen',
  'bathroom',
  'floor_plan',
  'view',
  'diwaniya_room',
  'exterior',
  'interior',
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

/** Pick the locale-appropriate area name, or null when no area is set.
 *  Used by card + detail mappers — surfaces the specific neighbourhood
 *  (e.g. "Bayan" instead of just the governorate "Hawalli"). */
function pickAreaName(
  area: { name_ar: string; name_en: string } | null,
  locale: 'ar' | 'en',
): string | null {
  if (!area) return null;
  return locale === 'ar' ? area.name_ar : area.name_en;
}

/** Pick the locale-appropriate title with fallbacks. */
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

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return Number(value);
}

function asImageCategory(
  value: string | null,
): PropertyImageCategory | null {
  if (value === null) return null;
  return (IMAGE_CATEGORIES as readonly string[]).includes(value)
    ? (value as PropertyImageCategory)
    : null;
}

/** Is this sub-cat slug one of the 8 real-estate children? */
function isPropertySubCat(slug: string | null | undefined): slug is PropertyCategoryKey {
  if (!slug) return false;
  return [
    'property-for-rent',
    'property-for-sale',
    'rooms-for-rent',
    'land',
    'property-for-exchange',
    'international-property',
    'property-management',
    'realestate-offices',
  ].includes(slug);
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapDetail(
  row: RawDetailRow,
  locale: 'ar' | 'en',
): PropertyDetail | null {
  const subCatSlug = row.category?.slug;
  if (!isPropertySubCat(subCatSlug)) {
    console.error(
      '[properties/queries] listing %s is not a real-estate sub-cat: %s',
      row.id,
      subCatSlug,
    );
    return null;
  }

  const validation = validatePropertyFieldsRaw(row.category_fields, subCatSlug);
  if (!validation.success) {
    console.error(
      '[properties/queries] category_fields validation failed for listing %s: %s',
      row.id,
      validation.error.message,
    );
    return null;
  }
  const fields = toPropertyFields(validation.data);

  const images: PropertyImage[] = (row.listing_images ?? [])
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

  return {
    id: row.id,
    slug: row.slug,
    subCat: subCatSlug,
    listingPurpose: purposeFromSubCat(subCatSlug),
    titleAr: row.title_ar,
    titleEn: row.title_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    title: pickTitle(row, locale),
    description: pickDescription(row, locale),
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code as PropertyDetail['currencyCode'],
    oldPriceMinorUnits: toNumberOrNull(row.old_price_minor_units),
    isPriceNegotiable:
      row.price_mode === 'negotiable' || row.price_mode === 'best_offer',
    verificationTier: row.verification_tier,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
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
    cityName: pickCityName(row.city, locale),
    areaId: row.area_id,
    areaName: pickAreaName(row.area, locale),
    images,
    viewCount: row.view_count,
    saveCount: row.save_count,
    chatInitiationCount: row.chat_initiation_count,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

function mapCard(
  row: RawCardRow,
  locale: 'ar' | 'en',
): PropertyCard | null {
  const subCatSlug = row.category?.slug;
  if (!isPropertySubCat(subCatSlug)) return null;

  const validation = validatePropertyFieldsRaw(row.category_fields, subCatSlug);
  if (!validation.success) return null;
  const f = toPropertyFields(validation.data);

  const cover =
    (row.listing_images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)[0]?.url ?? null;

  return {
    id: row.id,
    slug: row.slug,
    subCat: subCatSlug,
    listingPurpose: purposeFromSubCat(subCatSlug),
    title: pickTitle(row, locale),
    cover,
    priceMinorUnits: Number(row.price_minor_units),
    currencyCode: row.currency_code as PropertyCard['currencyCode'],
    oldPriceMinorUnits: toNumberOrNull(row.old_price_minor_units),
    isPriceNegotiable:
      row.price_mode === 'negotiable' || row.price_mode === 'best_offer',
    verificationTier: row.verification_tier,
    propertyType: f.propertyType,
    bedrooms: f.bedrooms ?? null,
    bathrooms: f.bathrooms ?? null,
    areaSqm: f.areaSqm ?? null,
    rentPeriod: f.rentPeriod ?? null,
    chequesCount: f.chequesCount ?? null,
    furnishedStatus: f.furnishedStatus ?? null,
    cityName: pickCityName(row.city, locale),
    areaName: pickAreaName(row.area, locale),
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a property detail page by slug (or numeric id).
 *
 * The input accepts both for parity with the rides vertical pattern —
 * the query layer sniffs whether the input is all-digits and branches
 * between `id` and `slug` filters.
 *
 * @returns `PropertyDetail` on success, `null` on any failure (not found,
 * not a real-estate listing, Zod validation failure). Consumers call
 * `notFound()` on null.
 */
export const getPropertyBySlug = cache(
  async function getPropertyBySlug(
    slugOrId: string | number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<PropertyDetail | null> {
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
        '[properties/queries] getPropertyBySlug(%s) error: %s',
        slugOrId,
        error.message,
      );
      return null;
    }
    if (!data) return null;

    return mapDetail(data as unknown as RawDetailRow, opts.locale);
  },
);

/**
 * Fetch "similar" property cards for the sidebar carousel.
 *
 * Algorithm:
 *   1. Same sub-cat as the source listing
 *   2. Same city
 *   3. Matching property_type (apartment vs villa vs chalet)
 *   4. Exclude the source listing itself
 *   5. Order by published_at DESC, limit N
 *
 * If fewer than N results after all filters, we loosen step 2 (drop
 * city match) and re-query. No algorithmic price-range filter — that
 * lives on the client as a future enhancement (P9).
 */
export const getSimilarProperties = cache(
  async function getSimilarProperties(
    sourceId: number,
    limit: number = 4,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<PropertyCard[]> {
    const supabase = createClient();

    // First, fetch the source row to extract sub_cat + city + property_type
    const { data: source } = await supabase
      .from('listings')
      .select(
        `id, city_id, category_fields, category:categories!listings_category_id_fkey ( slug )`,
      )
      .eq('id', sourceId)
      .maybeSingle();

    if (!source) return [];
    const sourceCat = (source as any).category?.slug as string | undefined;
    const sourceCityId = (source as any).city_id as number;
    const sourceType =
      ((source as any).category_fields as any)?.property_type ?? null;

    if (!isPropertySubCat(sourceCat)) return [];

    // Tight filter: same sub-cat + same city + same property_type
    const tightQuery = supabase
      .from('listings')
      .select(CARD_SELECT)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .neq('id', sourceId)
      .eq('city_id', sourceCityId)
      .eq('category_id', (
        await supabase.from('categories').select('id').eq('slug', sourceCat).single()
      ).data?.id ?? 0);

    if (sourceType) {
      tightQuery.eq('category_fields->>property_type', sourceType);
    }

    const tightRes = await tightQuery
      .order('published_at', { ascending: false })
      .limit(limit);

    let rows = ((tightRes.data as unknown as RawCardRow[]) ?? [])
      .map(r => mapCard(r, opts.locale))
      .filter((c): c is PropertyCard => c !== null);

    // Loose fallback: drop city match if we didn't get enough
    if (rows.length < limit) {
      const looseRes = await supabase
        .from('listings')
        .select(CARD_SELECT)
        .eq('status', 'live')
        .not('fraud_status', 'in', '(held,rejected)')
        .is('soft_deleted_at', null)
        .neq('id', sourceId)
        .eq('category_id', (
          await supabase.from('categories').select('id').eq('slug', sourceCat).single()
        ).data?.id ?? 0)
        .order('published_at', { ascending: false })
        .limit(limit * 2);

      const looseRows = ((looseRes.data as unknown as RawCardRow[]) ?? [])
        .map(r => mapCard(r, opts.locale))
        .filter((c): c is PropertyCard => c !== null);

      // Merge, dedupe by id, cap at limit
      const seen = new Set(rows.map(r => r.id));
      for (const r of looseRows) {
        if (rows.length >= limit) break;
        if (!seen.has(r.id)) {
          rows.push(r);
          seen.add(r.id);
        }
      }
    }

    return rows.slice(0, limit);
  },
);

// ---------------------------------------------------------------------------
// Hub queries — Phase 4c
// ---------------------------------------------------------------------------

/**
 * Featured properties — drives the "premium" row on /properties.
 *
 * Filter: is_featured=true, live, visible. Ordered by a doctrine-led
 * ranking:
 *   1. verification_tier DESC (dealo_inspected first)
 *   2. published_at DESC
 *
 * Default limit: 6 (two rows of 3 on desktop, or 3 cards × 2 rows).
 */
export const getFeaturedProperties = cache(
  async function getFeaturedProperties(
    opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<PropertyCard[]> {
    const limit = opts.limit ?? 6;
    const supabase = createClient();

    // Get real-estate parent's child ids
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', (
        await supabase.from('categories').select('id').eq('slug', 'real-estate').single()
      ).data?.id ?? 0);

    const subCatIds = (catData ?? []).map((c: any) => c.id);
    if (subCatIds.length === 0) return [];

    const { data, error } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .in('category_id', subCatIds)
      .eq('status', 'live')
      .eq('is_featured', true)
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .order('verification_tier', { ascending: false }) // dealo_inspected > ai_verified > unverified
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[properties/queries] getFeaturedProperties error:', error.message);
      return [];
    }
    if (!data) return [];

    return (data as unknown as RawCardRow[])
      .map(r => mapCard(r, opts.locale))
      .filter((c): c is PropertyCard => c !== null);
  },
);

/**
 * Main grid query for /properties hub.
 *
 * Supports a small set of filter params driven by the UI chips:
 *   - subCat?  filter by one of the 8 property-for-rent / -for-sale / etc.
 *   - propertyType?  filter by the 14-value property_type JSONB field
 *   - cityId?  optional city narrow
 *
 * Default order: published_at DESC. Returns up to `limit` PropertyCard rows.
 * Client-side sort (price asc/desc, newest, popular) is Phase 4c UI —
 * this query just exposes the raw ordered list.
 */
export const getPropertiesForGrid = cache(
  async function getPropertiesForGrid(
    opts: {
      limit?: number;
      subCat?: PropertyCategoryKey;
      propertyType?: string;
      cityId?: number;
      locale: 'ar' | 'en';
    } = { locale: 'ar' },
  ): Promise<PropertyCard[]> {
    const limit = opts.limit ?? 24;
    const supabase = createClient();

    // Resolve category scope
    let categoryIds: number[];
    if (opts.subCat) {
      const sc = await supabase
        .from('categories')
        .select('id')
        .eq('slug', opts.subCat)
        .single();
      if (!sc.data?.id) return [];
      categoryIds = [sc.data.id];
    } else {
      // All real-estate children
      const parent = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'real-estate')
        .single();
      if (!parent.data?.id) return [];
      const kids = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', parent.data.id);
      categoryIds = (kids.data ?? []).map((c: any) => c.id);
      if (categoryIds.length === 0) return [];
    }

    let q = supabase
      .from('listings')
      .select(CARD_SELECT)
      .in('category_id', categoryIds)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null);

    if (opts.propertyType) {
      q = q.eq('category_fields->>property_type', opts.propertyType);
    }
    if (opts.cityId) {
      q = q.eq('city_id', opts.cityId);
    }

    const { data, error } = await q
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[properties/queries] getPropertiesForGrid error:', error.message);
      return [];
    }
    if (!data) return [];

    return (data as unknown as RawCardRow[])
      .map(r => mapCard(r, opts.locale))
      .filter((c): c is PropertyCard => c !== null);
  },
);

/**
 * Live counts per property_type (inside JSONB) across live real-estate
 * listings. Drives the filter chip strip + "browse by type" tiles on
 * the hub page. Counts reflect only visible listings, so empty types
 * are excluded from the UI automatically.
 *
 * Returns a Record<propertyType, count>. Missing keys = 0.
 */
export const getPropertyTypeCounts = cache(
  async function getPropertyTypeCounts(): Promise<Record<string, number>> {
    const supabase = createClient();

    const parent = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'real-estate')
      .single();
    if (!parent.data?.id) return {};
    const kids = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', parent.data.id);
    const categoryIds = (kids.data ?? []).map((c: any) => c.id);
    if (categoryIds.length === 0) return {};

    const { data, error } = await supabase
      .from('listings')
      .select('category_fields')
      .in('category_id', categoryIds)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null);

    if (error) {
      console.error('[properties/queries] getPropertyTypeCounts error:', error.message);
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const type = (row as any).category_fields?.property_type as string | undefined;
      if (type) counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  },
);

// ---------------------------------------------------------------------------
// Live feed — Phase 5b+ addition (founder-flagged gap on /properties)
// ---------------------------------------------------------------------------

/**
 * Recent property activity for the /properties hub "Live activity" strip.
 *
 * Returns up to N most-recent live real-estate listings, mapped to a
 * compact PropertyActivityItem shape with a synthetic event type
 * derived from the listing's flags (new / price-drop / inspected /
 * featured). The "live" nature is a rotation on the client — each item
 * surfaces one at a time with a relative timestamp.
 *
 * No separate "events" table in V1 — the feed is built from listings
 * themselves. When a chat + offers system lands (Phase 5c / Phase 6),
 * that layer can emit richer event types (e.g., "just booked", "offer
 * accepted").
 */

export interface PropertyActivityItem {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  cityName: string;
  areaName: string | null;
  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  rentPeriod: PropertyFields['rentPeriod'] | null;
  propertyType: PropertyFields['propertyType'];
  verificationTier: VerificationTier;
  event: 'new' | 'price_drop' | 'inspected' | 'featured';
  createdAt: string;
}

export const getRecentPropertyActivity = cache(
  async function getRecentPropertyActivity(
    opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<PropertyActivityItem[]> {
    const limit = opts.limit ?? 12;
    const supabase = createClient();

    const parent = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'real-estate')
      .single();
    if (!parent.data?.id) return [];

    const kids = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', parent.data.id);
    const categoryIds = (kids.data ?? []).map((c: any) => c.id);
    if (categoryIds.length === 0) return [];

    const { data, error } = await supabase
      .from('listings')
      .select(CARD_SELECT + ', is_hot, old_price_minor_units')
      .in('category_id', categoryIds)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        '[properties/queries] getRecentPropertyActivity error:',
        error.message,
      );
      return [];
    }
    if (!data) return [];

    return (data as unknown as (RawCardRow & { is_hot?: boolean; old_price_minor_units?: number | string | null })[])
      .map(row => {
        const subCatSlug = row.category?.slug;
        if (!isPropertySubCat(subCatSlug)) return null;
        const validation = validatePropertyFieldsRaw(row.category_fields, subCatSlug);
        if (!validation.success) return null;
        const f = toPropertyFields(validation.data);

        const cover =
          (row.listing_images ?? [])
            .slice()
            .sort((a, b) => a.position - b.position)[0]?.url ?? null;

        // Derive event type — precedence:
        //   price_drop (has old_price_minor_units) > inspected (dealo_inspected tier)
        //   > featured (is_featured) > new (default).
        const hasPriceDrop = row.old_price_minor_units != null;
        const event: PropertyActivityItem['event'] = hasPriceDrop
          ? 'price_drop'
          : row.verification_tier === 'dealo_inspected'
          ? 'inspected'
          : row.is_featured
          ? 'featured'
          : 'new';

        return {
          id: row.id,
          slug: row.slug,
          title: pickTitle(row, opts.locale),
          cover,
          cityName: pickCityName(row.city, opts.locale),
          areaName: pickAreaName(row.area, opts.locale),
          priceMinorUnits: Number(row.price_minor_units),
          currencyCode: row.currency_code as PropertyActivityItem['currencyCode'],
          rentPeriod: f.rentPeriod ?? null,
          propertyType: f.propertyType,
          verificationTier: row.verification_tier,
          event,
          createdAt: row.created_at,
        } as PropertyActivityItem;
      })
      .filter((x): x is PropertyActivityItem => x !== null);
  },
);

// ---------------------------------------------------------------------------
// Convenience — ownership eligibility re-export for UI consumers
// ---------------------------------------------------------------------------
// Re-exported here so page-level UI can import from one place without
// reaching into validators. Same signature.

export { deriveOwnershipEligibility };
