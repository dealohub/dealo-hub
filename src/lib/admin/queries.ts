import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type {
  AdminBadges,
  AdminListingRow,
  GetListingsPageInput,
  GetListingsPageResult,
  ListingStatusTab,
  StatusCounts,
} from './types';

/**
 * Admin-surface queries. All are server-only and RLS-respecting; the server
 * actions in `./actions.ts` handle state mutations via SECURITY DEFINER RPCs.
 *
 * The `requireAdmin()` guard already ran in the caller (layout / page), so
 * these queries don't re-check admin status — they just read.
 *
 * `cache()` dedupes within a single render pass; bust across requests via
 * `revalidatePath('/admin/...')` in the corresponding server action.
 *
 * Types and the `LISTING_STATUS_TABS` enum live in `./types` so client
 * components can import them without pulling the `server-only` guard.
 */

// Re-export types for callers that still import from `@/lib/admin/queries`.
export type {
  AdminBadges,
  AdminListingRow,
  GetListingsPageInput,
  GetListingsPageResult,
  StatusCounts,
} from './types';
export { LISTING_STATUS_TABS, type ListingStatusTab } from './types';

// ===========================================================================
// Sidebar badges — held listings / ai_reviews / reports
// ===========================================================================

/**
 * Single-RPC fetch for the three badge counts the admin sidebar shows.
 *
 * Returns all-zeros on error rather than throwing — a broken badge counter
 * shouldn't blank the entire admin shell. Error is logged for observability.
 */
export const getAdminBadges = cache(async (): Promise<AdminBadges> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_badges' as never);

  if (error || !data) {
    console.error('[admin/queries] getAdminBadges error:', error?.message);
    return { held_count: 0, ai_held_count: 0, pending_reports_count: 0 };
  }

  // Type assertion: Supabase types haven't been regenerated for 0041/0042 yet.
  const parsed = data as unknown as AdminBadges;
  return {
    held_count: parsed.held_count ?? 0,
    ai_held_count: parsed.ai_held_count ?? 0,
    pending_reports_count: parsed.pending_reports_count ?? 0,
  };
});

// ===========================================================================
// Listings moderation page
// ===========================================================================

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * Paginated listings for the moderation table.
 *
 * Filters:
 *   - `tab`: listing_status enum or 'all'
 *   - `q`:   ILIKE on title (fuzzy search belongs in Phase 9b with meilisearch)
 *
 * Joins category (name_ar/name_en) and seller profile (display_name,
 * handle), plus the cover image (position=0 from listing_images).
 *
 * Admin RLS policy (0041) grants SELECT on all profiles; `listings` are
 * readable for admins because `public.is_admin()` short-circuits the
 * seller-only policy.
 */
export async function getListingsPage(
  input: GetListingsPageInput
): Promise<GetListingsPageResult> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let query = supabase
    .from('listings')
    .select(
      `
      id,
      title,
      status,
      fraud_status,
      price_minor_units,
      currency_code,
      country_code,
      category_id,
      seller_id,
      created_at,
      published_at,
      categories:category_id ( id, name_ar, name_en ),
      profiles:seller_id ( id, display_name, handle ),
      listing_images ( url, thumb_url, position )
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.tab !== 'all') {
    query = query.eq('status', input.tab);
  }

  if (input.q && input.q.trim().length > 0) {
    query = query.ilike('title', `%${input.q.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    console.error('[admin/queries] getListingsPage error:', error?.message);
    return {
      rows: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const rows: AdminListingRow[] = data.map((row: any) => {
    const cover = Array.isArray(row.listing_images)
      ? row.listing_images.find((img: any) => img.position === 0) ??
        row.listing_images[0] ??
        null
      : null;
    const category = row.categories;
    const seller = row.profiles;
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      fraud_status: row.fraud_status,
      price_minor_units: row.price_minor_units,
      currency_code: row.currency_code,
      country_code: row.country_code,
      category_id: row.category_id,
      category_name_ar: category?.name_ar ?? null,
      category_name_en: category?.name_en ?? null,
      seller_id: row.seller_id,
      seller_name: seller?.display_name ?? null,
      seller_handle: seller?.handle ?? null,
      thumbnail_url: cover?.thumb_url ?? cover?.url ?? null,
      created_at: row.created_at,
      published_at: row.published_at,
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { rows, total, page, pageSize, totalPages };
}

// ===========================================================================
// Status-tab counts (shown inside the tab labels)
// ===========================================================================

/**
 * Per-status counts for the moderation-page tab labels.
 * One aggregate query, grouped client-side.
 */
export const getListingStatusCounts = cache(async (): Promise<StatusCounts> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('status');

  const zero: StatusCounts = {
    all: 0,
    held: 0,
    live: 0,
    rejected: 0,
    draft: 0,
    sold: 0,
    archived: 0,
  };

  if (error || !data) {
    console.error('[admin/queries] getListingStatusCounts error:', error?.message);
    return zero;
  }

  const counts = { ...zero, all: data.length };
  for (const row of data as Array<{ status: string }>) {
    if (row.status in counts) {
      counts[row.status as ListingStatusTab]++;
    }
  }
  return counts;
});
