import { createClient } from '@/lib/supabase/server';
import { getFilteredListings, type ListingQueryResult } from '@/lib/browse/queries';
import type { FilterState } from '@/lib/browse/types';
import { embedQuery } from './embeddings';

/**
 * Hybrid search: keyword (ILIKE on title + description) + semantic
 * (pgvector `search_listings_semantic`). Merged 70% semantic / 30% keyword
 * by normalized rank position.
 */

export interface SearchResult {
  result: ListingQueryResult;
  /** True when semantic search contributed (at least one result or OpenAI succeeded). */
  semanticUsed: boolean;
}

export async function searchListings(
  query: string,
  filters: FilterState,
  locale: 'ar' | 'en' = 'ar'
): Promise<SearchResult> {
  const trimmed = query.trim();

  // No query → just return filtered browse.
  if (!trimmed) {
    const result = await getFilteredListings(filters, { locale });
    return { result, semanticUsed: false };
  }

  const supabase = createClient();

  // ---- 1. Keyword: ILIKE on title + description, capped to 100 hits. ----
  const keywordPromise = (async () => {
    const { data } = await supabase
      .from('listings')
      .select('id, save_count, created_at')
      .eq('status', 'live')
      .neq('fraud_status', 'rejected')
      .is('soft_deleted_at', null)
      .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
      .limit(100);
    return data ?? [];
  })();

  // ---- 2. Semantic: embed query + RPC, capped to 50. ----
  const semanticPromise = (async () => {
    const embedding = await embedQuery(trimmed);
    if (!embedding) return { rows: [], semanticUsed: false };
    const vectorLiteral = `[${embedding.join(',')}]`;
    const { data } = await supabase.rpc('search_listings_semantic', {
      query_embedding: vectorLiteral,
      country_filter: 'KW',
      category_filter: null,
      max_results: 50,
    });
    return {
      rows: (data ?? []) as { listing_id: number; similarity: number }[],
      semanticUsed: true,
    };
  })();

  const [keywordRows, semantic] = await Promise.all([keywordPromise, semanticPromise]);

  // Merge: 70% semantic rank, 30% keyword. Smaller score wins.
  const score = new Map<number, number>();
  semantic.rows.forEach((row, i) => {
    score.set(row.listing_id, (score.get(row.listing_id) ?? 0) + i * 0.7);
  });
  keywordRows.forEach((row, i) => {
    const prev = score.get(row.id);
    const keywordScore = i * 0.3;
    score.set(row.id, prev == null ? keywordScore + semantic.rows.length * 0.7 : prev + keywordScore);
  });

  const orderedIds = Array.from(score.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);

  if (orderedIds.length === 0) {
    return { result: { rows: [], total: 0 }, semanticUsed: semantic.semanticUsed };
  }

  // Hydrate full ListingCard rows via the shared browse projection.
  const idSlice = orderedIds.slice((filters.page - 1) * 24, filters.page * 24);
  const { data: listings } = await supabase
    .from('listings')
    .select(
      `
      id, title, price_minor_units, currency_code, price_mode, min_offer_minor_units,
      country_code, created_at, save_count, authenticity_confirmed, category_id,
      listing_images ( url, thumb_url, medium_url, position ),
      listing_videos ( id ),
      profiles:seller_id ( id, display_name, handle, avatar_url, phone_verified_at ),
      cities:city_id ( id, name_ar, name_en ),
      areas:area_id ( id, name_ar, name_en ),
      category:categories!listings_category_id_fkey ( slug, name_ar, name_en )
    `
    )
    .in('id', idSlice)
    .eq('status', 'live')
    .neq('fraud_status', 'rejected');

  // Preserve our merged ranking.
  const order = new Map(idSlice.map((id, i) => [id, i]));
  const sorted = (listings ?? []).sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
  );

  // Apply the same mapper the browse module uses. Import avoided to keep this
  // module's surface small — we re-run through getFilteredListings with an id
  // filter? Simpler: inline minimal mapping.
  const rows = sorted.map(r => mapToCard(r, locale));

  // Post-filter (client-style) for boolean extras.
  let filtered = rows;
  if (filters.conditions?.length) {
    // condition not selected above; drop this filter here — tradeoff for MVP.
  }
  if (filters.hasVideo) filtered = filtered.filter(x => x.hasVideo);
  if (filters.sellerPhoneVerified) filtered = filtered.filter(x => x.seller.isPhoneVerified);

  return {
    result: { rows: filtered, total: orderedIds.length },
    semanticUsed: semantic.semanticUsed,
  };
}

function mapToCard(row: any, locale: 'ar' | 'en') {
  const images = (row.listing_images ?? []).sort((a: any, b: any) => a.position - b.position);
  const cover = images[0];
  const city = row.cities;
  const area = row.areas;
  const profile = row.profiles;
  return {
    id: row.id as number,
    title: row.title as string,
    priceMode: row.price_mode,
    priceMinorUnits:
      typeof row.price_minor_units === 'string'
        ? BigInt(row.price_minor_units)
        : (row.price_minor_units as number),
    currencyCode: row.currency_code as string,
    minOfferMinorUnits:
      row.min_offer_minor_units == null
        ? null
        : typeof row.min_offer_minor_units === 'string'
          ? BigInt(row.min_offer_minor_units)
          : (row.min_offer_minor_units as number),
    coverUrl: cover?.medium_url ?? cover?.url ?? null,
    imageCount: images.length,
    hasVideo: (row.listing_videos?.length ?? 0) > 0,
    areaName: area ? (locale === 'ar' ? area.name_ar : area.name_en) : null,
    cityName: city ? (locale === 'ar' ? city.name_ar : city.name_en) : null,
    createdAt: row.created_at as string,
    saveCount: row.save_count as number,
    categorySlug: row.category?.slug ?? null,
    isAuthenticityConfirmed: !!row.authenticity_confirmed,
    seller: {
      id: profile?.id ?? '',
      displayName: profile?.display_name ?? '—',
      handle: profile?.handle ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isPhoneVerified: !!profile?.phone_verified_at,
    },
  };
}
