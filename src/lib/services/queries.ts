import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  validateServiceFieldsRaw,
  type ServiceFields,
} from './validators';
import type {
  ServiceDetail,
  ServiceCard,
  ServiceCategoryKey,
  ServiceProviderSummary,
  ServiceProviderVerificationTier,
  KwGovernorate,
  TaskType,
  ProviderLanguage,
} from './types';
import { isServiceSubCat, SERVICE_SUB_CATS } from './types';

/**
 * Read-side queries for the Services vertical (Phase 8a).
 *
 * Mirrors src/lib/electronics/queries.ts + src/lib/properties/queries.ts:
 *   - RLS-respecting client via await createClient()
 *   - React `cache()` de-dup on detail + provider lookups
 *   - snake_case DB → camelCase consumer mappers
 *
 * Phase 8a public queries (this file):
 *   - getServiceBySlug(slugOrId, locale?) → detail
 *   - getServicesForGrid(locale, opts?) → hub main grid
 *   - getFeaturedServices(locale, limit?) → hub featured strip
 *   - getServiceTaskTypeCounts() → hub filter chip counts
 *   - getProviderSummary(profileId) → provider header on detail
 *   - getReviewsForProvider(profileId, limit?) → reviews panel
 *
 * Phase 8a NOT in this file (future chunks):
 *   - Quote-flow reads (getOpenQuoteRequests for provider inbox) → actions layer
 *   - Booking reads (getMyBookings) → account surfaces
 *
 * Reference: planning/PHASE-8A-HOME-SERVICES.md §3
 */

// ---------------------------------------------------------------------------
// SELECT strings
// ---------------------------------------------------------------------------

const DETAIL_SELECT = `
  id, slug, title, title_ar, title_en, description, description_ar, description_en,
  price_mode, price_minor_units, currency_code,
  is_featured, is_hot,
  country_code, status, published_at, expires_at,
  created_at, category_fields,
  seller:profiles!listings_seller_id_fkey (
    id, display_name, handle, avatar_url,
    services_provider_verification_tier,
    created_at
  ),
  category:categories!listings_category_id_fkey ( id, slug, name_ar, name_en )
` as const;

const CARD_SELECT = `
  id, slug, title, title_ar, title_en,
  price_mode, price_minor_units, currency_code,
  is_featured, created_at, category_fields,
  country_code,
  seller:profiles!listings_seller_id_fkey (
    id, display_name, avatar_url,
    services_provider_verification_tier
  ),
  category:categories!listings_category_id_fkey ( slug )
` as const;

// ---------------------------------------------------------------------------
// Locale pickers (mirror pattern from electronics/queries.ts)
// ---------------------------------------------------------------------------

function isNumericInput(input: string | number): boolean {
  if (typeof input === 'number') return true;
  return /^\d+$/.test(input);
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

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapProvider(row: any): ServiceProviderSummary | null {
  if (!row) return null;
  const f = row as {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    services_provider_verification_tier: ServiceProviderVerificationTier;
    created_at: string;
  };
  return {
    profileId: f.id,
    displayName: f.display_name,
    handle: f.handle,
    avatarUrl: f.avatar_url,
    verificationTier: f.services_provider_verification_tier ?? 'unverified',
    // aggregates live on the category_fields JSONB and get merged by caller
    completedBookings: 0,
    ratingAvg: null,
    ratingCount: 0,
    spokenLanguages: [] as ReadonlyArray<ProviderLanguage>,
    yearsExperience: null,
    teamSize: 1,
    createdAt: f.created_at,
  };
}

function mergeProviderWithFields(
  provider: ServiceProviderSummary,
  fields: ServiceFields,
): ServiceProviderSummary {
  return {
    ...provider,
    completedBookings: fields.completed_bookings_count,
    ratingAvg: fields.rating_avg,
    ratingCount: fields.rating_count,
    spokenLanguages: fields.spoken_languages,
    yearsExperience: fields.years_experience ?? null,
    teamSize: fields.team_size,
  };
}

function mapDetail(row: any, locale: 'ar' | 'en'): ServiceDetail | null {
  const subCatSlug = row.category?.slug as string | undefined;
  if (!isServiceSubCat(subCatSlug)) {
    console.error(
      '[services/queries] listing %s is not a services sub-cat: %s',
      row.id,
      subCatSlug,
    );
    return null;
  }

  const validation = validateServiceFieldsRaw(row.category_fields);
  if (!validation.success) {
    console.error(
      '[services/queries] category_fields validation failed for listing %s: %s',
      row.id,
      validation.error.message,
    );
    return null;
  }
  const fields = validation.data;

  const baseProvider = mapProvider(row.seller);
  if (!baseProvider) return null;
  const provider = mergeProviderWithFields(baseProvider, fields);

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
    fields,
    provider,
    servedGovernorates: fields.served_governorates,
    servedAreaIds: [], // populated by a second query on service_areas_served when needed
    countryCode: (row.country_code ?? 'KW') as 'KW',
    createdAt: row.created_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    isFeatured: !!row.is_featured,
    isHot: !!row.is_hot,
  };
}

function mapCard(row: any, locale: 'ar' | 'en'): ServiceCard | null {
  const subCatSlug = row.category?.slug as string | undefined;
  if (!isServiceSubCat(subCatSlug)) return null;

  const validation = validateServiceFieldsRaw(row.category_fields);
  if (!validation.success) return null;
  const f = validation.data;

  const seller = row.seller as {
    id: string;
    display_name: string;
    avatar_url: string | null;
    services_provider_verification_tier: ServiceProviderVerificationTier;
  } | null;
  if (!seller) return null;

  return {
    id: row.id,
    slug: row.slug,
    subCat: subCatSlug,
    title: pickTitle(row, locale),
    taskType: f.task_type,
    priceMode: f.price_mode,
    hourlyRateMinorUnits: f.hourly_rate_minor_units ?? null,
    fixedPriceMinorUnits: f.fixed_price_minor_units ?? null,
    currencyCode: (row.currency_code ?? 'KWD') as 'KWD',
    providerDisplayName: seller.display_name,
    providerAvatarUrl: seller.avatar_url,
    verificationTier: seller.services_provider_verification_tier ?? 'unverified',
    ratingAvg: f.rating_avg,
    ratingCount: f.rating_count,
    completedBookings: f.completed_bookings_count,
    servedGovernorates: f.served_governorates,
    createdAt: row.created_at,
    isFeatured: !!row.is_featured,
  };
}

// ---------------------------------------------------------------------------
// Public API — detail
// ---------------------------------------------------------------------------

export const getServiceBySlug = cache(
  async function getServiceBySlug(
    slugOrId: string | number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<ServiceDetail | null> {
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
        '[services/queries] getServiceBySlug(%s) error: %s',
        slugOrId,
        error.message,
      );
      return null;
    }
    if (!data) return null;
    const detail = mapDetail(data as any, opts.locale);
    if (!detail) return null;

    // Fetch served areas (relation table) for area-level rendering
    const { data: areas } = await supabase
      .from('service_areas_served')
      .select('area_id')
      .eq('provider_profile_id', detail.provider.profileId);

    return {
      ...detail,
      servedAreaIds: ((areas ?? []) as { area_id: number }[]).map(
        (a) => a.area_id,
      ),
    };
  },
);

// ---------------------------------------------------------------------------
// Public API — hub
// ---------------------------------------------------------------------------

export const getFeaturedServices = cache(
  async function getFeaturedServices(
    opts: { locale: 'ar' | 'en'; limit?: number } = { locale: 'ar' },
  ): Promise<ServiceCard[]> {
    const supabase = await createClient();
    const parent = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'services')
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
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(opts.limit ?? 6);

    return ((data as any[]) ?? [])
      .map((r) => mapCard(r, opts.locale))
      .filter((x): x is ServiceCard => x !== null);
  },
);

export const getServicesForGrid = cache(
  async function getServicesForGrid(
    opts: {
      locale: 'ar' | 'en';
      limit?: number;
      subCat?: ServiceCategoryKey;
      taskType?: TaskType;
      governorate?: KwGovernorate;
      excludeIds?: number[];
    } = { locale: 'ar' },
  ): Promise<ServiceCard[]> {
    const supabase = await createClient();

    const parent = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'services')
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
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(opts.limit ?? 24);

    let cards = ((data as any[]) ?? [])
      .map((r) => mapCard(r, opts.locale))
      .filter((x): x is ServiceCard => x !== null);

    // Client-side filter on task_type + governorate (these live in the
    // JSONB; pushing them to SQL would require a custom RPC, not worth
    // it at Phase 8a volumes).
    if (opts.taskType) {
      cards = cards.filter((c) => c.taskType === opts.taskType);
    }
    if (opts.governorate) {
      cards = cards.filter((c) =>
        c.servedGovernorates.includes(opts.governorate as KwGovernorate),
      );
    }

    return cards;
  },
);

/**
 * Count listings per task_type for the hub's filter-chip bar.
 * Returns all 8 task_type keys with their live count (0 for empty).
 */
export async function getServiceTaskTypeCounts(): Promise<
  Record<TaskType, number>
> {
  const zero: Record<TaskType, number> = {
    home_cleaning_one_off: 0,
    home_cleaning_recurring: 0,
    handyman_ikea_assembly: 0,
    handyman_tv_mount: 0,
    handyman_shelf_hang: 0,
    handyman_furniture_move: 0,
    handyman_basic_painting: 0,
    handyman_other: 0,
  };

  const supabase = await createClient();
  const parent = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'services')
    .single();
  if (!parent.data?.id) return zero;

  const kids = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', parent.data.id);
  const ids = (kids.data ?? []).map((c: any) => c.id);
  if (ids.length === 0) return zero;

  const { data } = await supabase
    .from('listings')
    .select('category_fields')
    .in('category_id', ids)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null);

  for (const r of (data ?? []) as Array<{ category_fields: any }>) {
    const t = r.category_fields?.task_type as TaskType | undefined;
    if (t && t in zero) zero[t] += 1;
  }
  return zero;
}

// ---------------------------------------------------------------------------
// Public API — provider + reviews
// ---------------------------------------------------------------------------

export interface ServiceReviewRow {
  id: number;
  bookingId: number;
  reviewerDisplayName: string;
  reviewerAvatarUrl: string | null;
  rating: number;
  body: string | null;
  tagOnTime: boolean | null;
  tagCleanWork: boolean | null;
  tagFairPrice: boolean | null;
  createdAt: string;
}

export const getReviewsForProvider = cache(
  async function getReviewsForProvider(
    profileId: string,
    limit = 10,
  ): Promise<ServiceReviewRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_reviews')
      .select(
        `
        id, booking_id, rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at,
        reviewer:profiles!service_reviews_reviewer_profile_id_fkey (
          display_name, avatar_url
        )
        `,
      )
      .eq('reviewed_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as any[]).map((r) => ({
      id: r.id,
      bookingId: r.booking_id,
      reviewerDisplayName: r.reviewer?.display_name ?? '—',
      reviewerAvatarUrl: r.reviewer?.avatar_url ?? null,
      rating: r.rating,
      body: r.body ?? null,
      tagOnTime: r.tag_on_time ?? null,
      tagCleanWork: r.tag_clean_work ?? null,
      tagFairPrice: r.tag_fair_price ?? null,
      createdAt: r.created_at,
    }));
  },
);

export const getSimilarServices = cache(
  async function getSimilarServices(
    listingId: number,
    taskType: TaskType,
    limit: number,
    opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
  ): Promise<ServiceCard[]> {
    const supabase = await createClient();

    // Step 1 — same task_type (tight match)
    const { data: tight } = await supabase
      .from('listings')
      .select(CARD_SELECT)
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null)
      .neq('id', listingId)
      .filter('category_fields->>task_type', 'eq', taskType)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    let rows = (tight as any[]) ?? [];

    // Step 2 — same family (cleaning OR handyman) if tight pool undersized
    if (rows.length < limit) {
      const family = taskType.startsWith('home_cleaning_') ? 'home_cleaning_' : 'handyman_';
      const { data: fb } = await supabase
        .from('listings')
        .select(CARD_SELECT)
        .eq('status', 'live')
        .not('fraud_status', 'in', '(held,rejected)')
        .is('soft_deleted_at', null)
        .neq('id', listingId)
        .filter('category_fields->>task_type', 'like', `${family}%`)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);
      rows = (fb as any[]) ?? rows;
    }

    return rows
      .map((r) => mapCard(r, opts.locale))
      .filter((x): x is ServiceCard => x !== null);
  },
);

// Re-export so the sub-cat set is importable from a single place.
export { SERVICE_SUB_CATS };
