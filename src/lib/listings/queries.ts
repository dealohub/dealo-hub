import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { DraftState, WizardStep } from './draft';

/**
 * Queries consumed by wizard pages.
 * Kept `cache`-wrapped so a single server-render pass doesn't re-hit the DB.
 */

// ---------------------------------------------------------------------------
// Categories (parents + sub-categories) for the Step 1 picker
// ---------------------------------------------------------------------------

export interface ParentCategory {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  icon: string | null;
  tier: 'p0' | 'p1' | 'p2';
  sort_order: number;
  requires_video: boolean;
  min_photos: number;
  requires_auth_statement: boolean;
  sub_categories: SubCategorySummary[];
}

export interface SubCategorySummary {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
}

export const getCategoriesWithSubs = cache(async (): Promise<ParentCategory[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select(
      'id, parent_id, slug, name_ar, name_en, icon, tier, sort_order, requires_video, min_photos, requires_auth_statement'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.error('[listings/queries] getCategoriesWithSubs error:', error?.message);
    return [];
  }

  const parents: ParentCategory[] = [];
  const subsByParent = new Map<number, SubCategorySummary[]>();

  for (const row of data) {
    if (row.parent_id == null) {
      parents.push({
        id: row.id,
        slug: row.slug,
        name_ar: row.name_ar,
        name_en: row.name_en,
        icon: row.icon,
        tier: (row.tier ?? 'p2') as 'p0' | 'p1' | 'p2',
        sort_order: row.sort_order,
        requires_video: row.requires_video,
        min_photos: row.min_photos,
        requires_auth_statement: row.requires_auth_statement,
        sub_categories: [],
      });
    } else {
      const bucket = subsByParent.get(row.parent_id) ?? [];
      bucket.push({
        id: row.id,
        slug: row.slug,
        name_ar: row.name_ar,
        name_en: row.name_en,
        sort_order: row.sort_order,
      });
      subsByParent.set(row.parent_id, bucket);
    }
  }

  for (const p of parents) {
    p.sub_categories = (subsByParent.get(p.id) ?? []).sort((a, b) => a.sort_order - b.sort_order);
  }

  return parents.sort((a, b) => a.sort_order - b.sort_order);
});

// ---------------------------------------------------------------------------
// Current user's draft
// ---------------------------------------------------------------------------

export const getCurrentDraft = cache(async (): Promise<DraftState | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('listing_drafts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    category_id: data.category_id,
    subcategory_id: data.subcategory_id,
    image_urls: data.image_urls ?? [],
    video_url: data.video_url,
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    condition: data.condition,
    brand: data.brand,
    model: data.model,
    color: data.color,
    price_minor_units: data.price_minor_units,
    currency_code: data.currency_code ?? 'KWD',
    price_mode: data.price_mode,
    min_offer_minor_units: data.min_offer_minor_units,
    country_code: data.country_code ?? 'KW',
    city_id: data.city_id,
    area_id: data.area_id,
    delivery_options: data.delivery_options ?? [],
    authenticity_confirmed: data.authenticity_confirmed ?? false,
    has_receipt: data.has_receipt ?? false,
    serial_number: data.serial_number,
    current_step: (data.current_step as WizardStep) ?? 'category',
    updated_at: data.updated_at,
  };
});

// ---------------------------------------------------------------------------
// Cities + areas for Step 5
// ---------------------------------------------------------------------------

export const getKuwaitCities = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cities')
    .select('id, slug, name_ar, name_en, sort_order')
    .eq('country_code', 'KW')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
});

export async function getAreasForCity(cityId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('areas')
    .select('id, slug, name_ar, name_en, sort_order')
    .eq('city_id', cityId)
    .order('sort_order', { ascending: true });
  return data ?? [];
}
