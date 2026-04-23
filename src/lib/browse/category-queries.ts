import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Category-level browse queries.
 *
 * Two questions to answer:
 *   1. "Show me every top-level category with its live-listing count"
 *      → `getTopLevelCategoriesWithCounts()` for the /categories index.
 *   2. "Show me a single category's metadata + sub-category chips"
 *      → `getCategoryBySlug()` for the /categories/[slug] page.
 *
 * Live-listing count is computed in a single round-trip via a CASE-style
 * subquery (one COUNT() per top-level category, scoped to the parent's
 * own id PLUS its children). No N+1: the supabase client doesn't
 * support raw SQL aggregates inline, so we do it as a 2-step pass:
 * first pull all parents+children, then a single `listings` query
 * grouped client-side. That's still fewer round-trips than calling
 * the categories endpoint per parent.
 *
 * RLS-respecting (`createClient`); the public-read policy on listings
 * already filters out non-live + soft-deleted + fraud-rejected rows.
 */

export interface TopLevelCategory {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
  tier: 'p0' | 'p1' | 'p2';
  sortOrder: number;
  /** Live-listing count across this parent + all its children. */
  liveCount: number;
}

export interface CategoryDetail extends TopLevelCategory {
  /** Sub-categories belonging to this parent. */
  subCategories: Array<{
    id: number;
    slug: string;
    nameAr: string;
    nameEn: string;
    sortOrder: number;
  }>;
}

// ---------------------------------------------------------------------------
// Top-level index
// ---------------------------------------------------------------------------

export const getTopLevelCategoriesWithCounts = cache(
  async function getTopLevelCategoriesWithCounts(): Promise<TopLevelCategory[]> {
    const supabase = await createClient();

    // Step 1 — every active category (parent + children). One round-trip.
    const { data: catRows, error: catErr } = await supabase
      .from('categories')
      .select('id, parent_id, slug, name_ar, name_en, icon, tier, sort_order')
      .eq('is_active', true);

    if (catErr || !catRows) {
      console.error(
        '[browse/category-queries] load categories failed:',
        catErr?.message,
      );
      return [];
    }

    // Step 2 — listing counts grouped by category_id. RLS filters to
    // live + non-fraud + non-soft-deleted automatically (public_read).
    const { data: listingRows, error: lErr } = await supabase
      .from('listings')
      .select('category_id')
      .eq('status', 'live')
      .not('fraud_status', 'in', '(held,rejected)')
      .is('soft_deleted_at', null);

    if (lErr) {
      console.error(
        '[browse/category-queries] count listings failed:',
        lErr.message,
      );
    }

    const countByCatId = new Map<number, number>();
    for (const row of (listingRows ?? []) as Array<{ category_id: number }>) {
      countByCatId.set(row.category_id, (countByCatId.get(row.category_id) ?? 0) + 1);
    }

    // Step 3 — map child counts up to parents.
    const childToParent = new Map<number, number>();
    for (const c of catRows as Array<{ id: number; parent_id: number | null }>) {
      if (c.parent_id != null) childToParent.set(c.id, c.parent_id);
    }

    const parentCounts = new Map<number, number>();
    for (const [catId, count] of countByCatId) {
      const parentId = childToParent.get(catId) ?? catId; // catId itself if no parent
      parentCounts.set(parentId, (parentCounts.get(parentId) ?? 0) + count);
    }

    // Step 4 — build the parent list.
    const parents = (catRows as any[])
      .filter(c => c.parent_id == null)
      .map(c => ({
        id: c.id as number,
        slug: c.slug as string,
        nameAr: c.name_ar as string,
        nameEn: c.name_en as string,
        icon: (c.icon as string | null) ?? null,
        tier: ((c.tier as string) ?? 'p2') as 'p0' | 'p1' | 'p2',
        sortOrder: c.sort_order as number,
        liveCount: parentCounts.get(c.id) ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return parents;
  },
);

// ---------------------------------------------------------------------------
// Per-category lookup
// ---------------------------------------------------------------------------

export const getCategoryBySlug = cache(
  async function getCategoryBySlug(
    slug: string,
  ): Promise<CategoryDetail | null> {
    const supabase = await createClient();

    const { data: parent, error: parentErr } = await supabase
      .from('categories')
      .select('id, slug, name_ar, name_en, icon, tier, sort_order')
      .eq('slug', slug)
      .is('parent_id', null)
      .eq('is_active', true)
      .maybeSingle();

    if (parentErr || !parent) {
      if (parentErr) {
        console.error(
          '[browse/category-queries] getCategoryBySlug error:',
          parentErr.message,
        );
      }
      return null;
    }

    const { data: subs } = await supabase
      .from('categories')
      .select('id, slug, name_ar, name_en, sort_order')
      .eq('parent_id', (parent as any).id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Live count for this parent + its children (single pass).
    const childIds = ((subs ?? []) as Array<{ id: number }>).map(s => s.id);
    const idsToCount = [(parent as any).id as number, ...childIds];

    let liveCount = 0;
    if (idsToCount.length > 0) {
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .in('category_id', idsToCount)
        .eq('status', 'live')
        .not('fraud_status', 'in', '(held,rejected)')
        .is('soft_deleted_at', null);
      liveCount = count ?? 0;
    }

    return {
      id: (parent as any).id,
      slug: (parent as any).slug,
      nameAr: (parent as any).name_ar,
      nameEn: (parent as any).name_en,
      icon: ((parent as any).icon as string | null) ?? null,
      tier: (((parent as any).tier as string) ?? 'p2') as 'p0' | 'p1' | 'p2',
      sortOrder: (parent as any).sort_order,
      liveCount,
      subCategories: ((subs ?? []) as any[]).map(s => ({
        id: s.id as number,
        slug: s.slug as string,
        nameAr: s.name_ar as string,
        nameEn: s.name_en as string,
        sortOrder: s.sort_order as number,
      })),
    };
  },
);
