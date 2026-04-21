import { createClient } from '@/lib/supabase/server';

/**
 * Sitemap data layer.
 *
 * Returns the raw entries the dynamic sitemap needs — slug, last-
 * modified timestamp, the parent slug used to route to the right
 * detail surface (/rides, /properties, /listings).
 *
 * Only public, indexable rows are included:
 *   • status = 'live'
 *   • fraud_status NOT in (held, rejected)
 *   • soft_deleted_at IS NULL
 *
 * The RLS policy `public_read_live_listings` already enforces these
 * filters — we restate them here so the assertion is visible at the
 * call site (and to be safe if an upstream policy ever loosens).
 *
 * Performance: a single SELECT covers every live listing (~16 today,
 * still small in 6 months). When inventory crosses ~50 000 we'll
 * paginate the sitemap into multiple files (Google caps at 50 000
 * URLs per file) and switch this query to keyset pagination.
 */

export interface SitemapListingEntry {
  /** Stable slug used as the URL segment (or numeric id when the
   *  seed-time slug-generator hasn't run on a particular row). */
  slugOrId: string;
  /** ISO timestamp of the last meaningful change. */
  updatedAt: string;
  /**
   * Parent category slug (`automotive` / `real-estate` / null).
   * Drives which detail-page route to emit the URL under.
   */
  parentSlug: string | null;
}

/**
 * One round-trip — joins listings → categories(parent_id) → categories
 * for the parent slug. Two-step nested embed avoids the PostgREST
 * self-FK gotcha (already noted across the codebase).
 */
export async function getAllPublicListingEntries(): Promise<SitemapListingEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
        id, slug, updated_at, published_at,
        category:categories!listings_category_id_fkey ( id, slug, parent_id )
      `,
    )
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null)
    .order('published_at', { ascending: false });

  if (error || !data) {
    console.error('[seo/sitemap-queries] load listings failed:', error?.message);
    return [];
  }

  // Pull every distinct parent_id to resolve parent slugs in one go.
  const parentIds = new Set<number>();
  for (const row of data as any[]) {
    const pid = row.category?.parent_id as number | null | undefined;
    if (typeof pid === 'number') parentIds.add(pid);
  }

  const parentSlugById = new Map<number, string>();
  if (parentIds.size > 0) {
    const { data: parents } = await supabase
      .from('categories')
      .select('id, slug')
      .in('id', Array.from(parentIds));
    for (const p of (parents ?? []) as Array<{ id: number; slug: string }>) {
      parentSlugById.set(p.id, p.slug);
    }
  }

  return (data as any[]).map(row => {
    const pid = row.category?.parent_id as number | null | undefined;
    const parentSlug =
      typeof pid === 'number' ? parentSlugById.get(pid) ?? null : null;
    return {
      slugOrId: (row.slug as string) ?? String(row.id),
      updatedAt:
        (row.updated_at as string | null) ??
        (row.published_at as string | null) ??
        new Date().toISOString(),
      parentSlug,
    };
  });
}

/**
 * Pull every active top-level category slug for the categories
 * sitemap section. Each parent yields `/categories/<slug>` plus the
 * vertical hubs already emit their own URLs (rides, properties).
 */
export async function getAllPublicCategorySlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('slug, created_at')
    .is('parent_id', null)
    .eq('is_active', true);
  if (error || !data) return [];
  // Categories don't have an `updated_at` column; use `created_at` as
  // the lastmod proxy. They rarely change post-seed and Google treats
  // a slightly-stale lastmod as a benign hint, not a freshness lie.
  return (data as any[]).map(c => ({
    slug: c.slug as string,
    updatedAt: (c.created_at as string | null) ?? new Date().toISOString(),
  }));
}
