'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { moveDraftImagesToListing } from '@/lib/supabase/storage-listings';
import { checkRateLimit } from '@/lib/rate-limit/check';
import { generateListingEmbedding } from './embeddings';
import { PublishSchema } from './validators';
import { validatePropertyFieldsRaw } from '@/lib/properties/validators';
import type { PropertyCategoryKey } from '@/lib/properties/types';
import {
  validateElectronicsFieldsRawV2,
  containsElectronicsCounterfeitTerm,
} from '@/lib/electronics/validators';
import {
  ELECTRONICS_SUB_CATS,
  type ElectronicsCategoryKey,
} from '@/lib/electronics/types';
import { containsCounterfeitTerm } from './validators';
import { listingDetailHrefFromParent } from './route';
import type { DraftState, WizardStep } from './draft';

/** Sub-cat slugs recognized by the Properties vertical. Mirrors
 *  `PropertyCategoryKey` in src/lib/properties/types.ts. Kept here to
 *  avoid a circular import when narrowing the slug coming back from
 *  the categories lookup. */
const PROPERTY_SUBCAT_SLUGS: ReadonlyArray<PropertyCategoryKey> = [
  'property-for-rent',
  'property-for-sale',
  'rooms-for-rent',
  'land',
  'property-for-exchange',
  'international-property',
  'property-management',
  'realestate-offices',
];

function asPropertyCategoryKey(slug: string | null | undefined): PropertyCategoryKey | null {
  if (!slug) return null;
  return (PROPERTY_SUBCAT_SLUGS as ReadonlyArray<string>).includes(slug)
    ? (slug as PropertyCategoryKey)
    : null;
}

function asElectronicsCategoryKey(
  slug: string | null | undefined,
): ElectronicsCategoryKey | null {
  if (!slug) return null;
  return (ELECTRONICS_SUB_CATS as ReadonlyArray<string>).includes(slug)
    ? (slug as ElectronicsCategoryKey)
    : null;
}

/**
 * Draft + publish server actions.
 *
 * `saveDraft` is the debounced DB write target — client calls it after every
 * field change (debounced 1s via `createDebouncedRemoteSaver`). Accepts a
 * partial state + upserts into `listing_drafts` (UNIQUE user_id).
 *
 * `publishListing` is stubbed for the session boundary — full validation +
 * INSERT into `listings` + image-move lands with Steps 6-13 in the next session.
 */

export type DraftActionResult =
  | { ok: true; draft_id?: string }
  | { ok: false; error: string };

export async function saveDraft(state: DraftState): Promise<DraftActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Map DraftState -> DB columns. Keep it boring; types mirror the table.
  const payload = {
    user_id: user.id,
    category_id: state.category_id ?? null,
    subcategory_id: state.subcategory_id ?? null,
    title: state.title ?? null,
    description: state.description ?? null,
    condition: state.condition ?? null,
    brand: state.brand ?? null,
    model: state.model ?? null,
    color: state.color ?? null,
    price_minor_units: state.price_minor_units ?? null,
    currency_code: state.currency_code ?? 'KWD',
    price_mode: state.price_mode ?? null,
    min_offer_minor_units: state.min_offer_minor_units ?? null,
    country_code: state.country_code ?? 'KW',
    city_id: state.city_id ?? null,
    area_id: state.area_id ?? null,
    delivery_options: state.delivery_options ?? [],
    authenticity_confirmed: state.authenticity_confirmed ?? false,
    has_receipt: state.has_receipt ?? false,
    serial_number: state.serial_number ?? null,
    image_urls: state.image_urls ?? [],
    video_url: state.video_url ?? null,
    category_fields: state.category_fields ?? {},
    current_step: state.current_step ?? 'category',
  };

  const { data, error } = await supabase
    .from('listing_drafts')
    .upsert(payload, { onConflict: 'user_id' })
    .select('id')
    .single();

  if (error) {
    console.error('[listings/actions] saveDraft error:', error.message);
    return { ok: false, error: 'save_failed' };
  }

  return { ok: true, draft_id: data.id };
}

export async function deleteDraft(): Promise<DraftActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { error } = await supabase
    .from('listing_drafts')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('[listings/actions] deleteDraft error:', error.message);
    return { ok: false, error: 'delete_failed' };
  }

  revalidatePath('/sell');
  return { ok: true };
}

/**
 * Returns the current user's draft id, creating an empty row if none exists.
 * Client components use this before their first upload so image objects land
 * under `{user_uuid}/drafts/{draft_id}/...`.
 */
export async function ensureDraftId(): Promise<
  { ok: true; user_id: string; draft_id: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase
    .from('listing_drafts')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[listings/actions] ensureDraftId error:', error?.message);
    return { ok: false, error: 'save_failed' };
  }

  return { ok: true, user_id: user.id, draft_id: data.id };
}

export async function setDraftStep(step: WizardStep): Promise<DraftActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { error } = await supabase
    .from('listing_drafts')
    .upsert(
      { user_id: user.id, current_step: step },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[listings/actions] setDraftStep error:', error.message);
    return { ok: false, error: 'save_failed' };
  }

  return { ok: true };
}

/** List cascading areas for a city — used by the Step 5 location picker. */
export async function fetchAreasForCity(
  cityId: number
): Promise<{ id: number; name_ar: string; name_en: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('areas')
    .select('id, name_ar, name_en, sort_order')
    .eq('city_id', cityId)
    .order('sort_order', { ascending: true });
  return (data ?? []).map(a => ({ id: a.id, name_ar: a.name_ar, name_en: a.name_en }));
}

// ---------------------------------------------------------------------------
// publishListing — validate → INSERT listing → INSERT listing_images →
// move storage objects from drafts/ to listings/ → delete draft → redirect.
// ---------------------------------------------------------------------------

export type PublishResult =
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function publishListing(locale: 'ar' | 'en' = 'ar'): Promise<PublishResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Rate limit: 20 publishes / hour / user. Even a power seller doesn't
  // legitimately list more than that — anything higher is either a bug
  // in a retry loop or a bot staging spam inventory.
  const within = await checkRateLimit({
    action: 'listings.publish',
    max: 20,
    windowSeconds: 3600,
  });
  if (!within) return { ok: false, error: 'rate_limited' };

  const { data: draft, error: draftErr } = await supabase
    .from('listing_drafts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (draftErr || !draft) {
    return { ok: false, error: 'no_draft' };
  }

  // Validate with PublishSchema — enforces Sprint 2 phone + counterfeit filters.
  const parsed = PublishSchema.safeParse({
    category_id: draft.category_id,
    subcategory_id: draft.subcategory_id,
    title: draft.title,
    description: draft.description,
    condition: draft.condition,
    brand: draft.brand,
    model: draft.model,
    price_minor_units: draft.price_minor_units,
    currency_code: draft.currency_code ?? 'KWD',
    price_mode: draft.price_mode,
    min_offer_minor_units: draft.min_offer_minor_units,
    country_code: draft.country_code ?? 'KW',
    city_id: draft.city_id,
    area_id: draft.area_id,
    delivery_options: draft.delivery_options,
    authenticity_confirmed: draft.authenticity_confirmed,
    has_receipt: draft.has_receipt,
    serial_number: draft.serial_number,
    image_urls: draft.image_urls,
    video_url: draft.video_url,
    category_fields: draft.category_fields ?? {},
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'validation_failed', fieldErrors };
  }

  const v = parsed.data;

  // ── Vertical routing + vertical-specific validation ─────────────────
  // Resolve the category row + parent slug up-front. We need this twice:
  //   (a) to pick the right per-vertical validator for category_fields
  //       (real-estate → PropertyFields conditional-required checks)
  //   (b) later, to redirect the seller to the correct detail page
  //
  // NOTE: two-step lookup — PostgREST's self-FK embed on
  // `categories.parent_id → categories.id` is unreliable (same gotcha
  // noted in landing/queries.ts + chat/queries.ts).
  const { data: catRow } = await supabase
    .from('categories')
    .select('slug, parent_id')
    .eq('id', v.category_id)
    .maybeSingle();

  let parentSlug: string | undefined;
  const parentId = (catRow as any)?.parent_id as number | null | undefined;
  if (typeof parentId === 'number') {
    const { data: parentRow } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', parentId)
      .maybeSingle();
    parentSlug = (parentRow as any)?.slug as string | undefined;
  }
  const subCatSlug = ((catRow as any)?.slug as string | undefined) ?? null;

  // Properties-specific validation: the 34-field PropertyFields shape
  // plus conditional-required invariants (rent_period for rent,
  // completion_status for sale, payment_plan for off-plan, etc.).
  // Rejection UX: field errors surface in the preview step the same
  // way PublishSchema errors do, keyed under `category_fields`.
  if (parentSlug === 'real-estate') {
    const propertySubCat = asPropertyCategoryKey(subCatSlug);
    if (!propertySubCat) {
      return {
        ok: false,
        error: 'validation_failed',
        fieldErrors: { category_fields: 'property_sub_cat_required' },
      };
    }
    const propertyResult = validatePropertyFieldsRaw(v.category_fields, propertySubCat);
    if (!propertyResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of propertyResult.error.issues) {
        // Flatten nested path (e.g. ['availability','min_stay_nights']) to
        // a single dot key so the UI can lookup a single translation.
        const key = issue.path.filter(p => typeof p === 'string' || typeof p === 'number').join('.');
        const field = key || 'category_fields';
        if (!(field in fieldErrors)) fieldErrors[field] = issue.message;
      }
      return { ok: false, error: 'validation_failed', fieldErrors };
    }
  }

  // Electronics v2 validation — 14-field ElectronicsFields schema with
  // sub-cat conditional requirements (phones need storage, laptops need
  // CPU/RAM/screen, smart-watches need battery health, TVs need
  // resolution + screen size, camera lenses need mount). Field-level
  // errors flatten to dot-path keys the preview UI can i18n-lookup.
  //
  // Reference: planning/PHASE-7A-ELECTRONICS-V2.md §P1-P9.
  if (parentSlug === 'electronics') {
    const electronicsSubCat = asElectronicsCategoryKey(subCatSlug);
    if (!electronicsSubCat) {
      return {
        ok: false,
        error: 'validation_failed',
        fieldErrors: { category_fields: 'electronics_sub_cat_required' },
      };
    }
    const r = validateElectronicsFieldsRawV2(
      v.category_fields,
      electronicsSubCat,
    );
    if (!r.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of r.error.issues) {
        const key = issue.path
          .filter(p => typeof p === 'string' || typeof p === 'number')
          .join('.');
        const field = key || 'category_fields';
        if (!(field in fieldErrors)) fieldErrors[field] = issue.message;
      }
      return { ok: false, error: 'validation_failed', fieldErrors };
    }
  }

  // Counterfeit gate — Filter D in Phase 7 v2 doctrine. Electronics uses
  // the widened 16-term blocklist (EN + AR, harvested from live Gulf
  // observation). Luxury uses the original 6-term list from Sprint 2.
  // Both widen at publish time on combined title + description + brand +
  // model text.
  if (parentSlug === 'electronics') {
    const combined = [
      v.title,
      v.description,
      v.brand ?? '',
      v.model ?? '',
    ].join(' ');
    if (containsElectronicsCounterfeitTerm(combined)) {
      return {
        ok: false,
        error: 'validation_failed',
        fieldErrors: { description: 'counterfeit_term_not_allowed' },
      };
    }
  }
  if (parentSlug === 'luxury') {
    const combined = [
      v.title,
      v.description,
      v.brand ?? '',
      v.model ?? '',
    ].join(' ');
    if (containsCounterfeitTerm(combined)) {
      return {
        ok: false,
        error: 'validation_failed',
        fieldErrors: { description: 'counterfeit_term_not_allowed' },
      };
    }
  }

  // Insert the listing with status='draft' until fraud pipeline lands in
  // BRIEF-007. Per the listings CHECK constraint, 'draft' is a valid initial
  // state; we leave `published_at` null for now.
  const { data: listingRow, error: listingErr } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      category_id: v.category_id,
      subcategory_id: v.subcategory_id ?? null,
      title: v.title,
      description: v.description,
      condition: v.condition,
      brand: v.brand ?? null,
      model: v.model ?? null,
      price_mode: v.price_mode,
      price_minor_units: v.price_minor_units,
      currency_code: 'KWD',
      min_offer_minor_units: v.min_offer_minor_units ?? null,
      country_code: 'KW',
      city_id: v.city_id,
      area_id: v.area_id ?? null,
      delivery_options: v.delivery_options,
      authenticity_confirmed: v.authenticity_confirmed,
      has_receipt: v.has_receipt,
      serial_number: v.serial_number ?? null,
      category_fields: v.category_fields ?? {},
      // Publish immediately. BRIEF-007 will gate via `fraud_status`, not `status`.
      status: 'live',
      published_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (listingErr || !listingRow) {
    console.error('[listings/actions] publishListing insert error:', listingErr?.message);
    return { ok: false, error: 'insert_failed' };
  }

  const listingId = listingRow.id;

  // Move uploaded images from drafts/{draft_id}/ to listings/{listing_id}/.
  const finalImageUrls = await moveDraftImagesToListing(
    user.id,
    draft.id,
    listingId,
    v.image_urls
  );

  // Insert listing_images rows.
  const imagesPayload = finalImageUrls.map((url, idx) => ({
    listing_id: listingId,
    url,
    width: 1920,
    height: 1920,
    position: idx,
  }));
  if (imagesPayload.length > 0) {
    const { error: imgErr } = await supabase.from('listing_images').insert(imagesPayload);
    if (imgErr) {
      console.error('[listings/actions] listing_images insert error:', imgErr.message);
      // Listing is still created — surface as warning but don't block.
    }
  }

  // Luxury video: insert listing_videos row.
  if (v.video_url) {
    const { error: vErr } = await supabase.from('listing_videos').insert({
      listing_id: listingId,
      url: v.video_url,
    });
    if (vErr) console.error('[listings/actions] listing_videos insert error:', vErr.message);
  }

  // Delete draft + orphan cleanup by cascade (unused — draft row had no images left).
  await supabase.from('listing_drafts').delete().eq('user_id', user.id);

  // Fire embedding generation — fail-open so a transient OpenAI outage never
  // blocks publishing. Also shielded from missing OPENAI_API_KEY inside the fn.
  try {
    await generateListingEmbedding(listingId);
  } catch (err) {
    console.error('[listings/actions] embedding generation failed:', (err as Error).message);
  }

  // `parentSlug` already resolved above (pre-validation). Use it for
  // the vertical detail-page redirect.
  // Automotive → /rides/[slug], real-estate → /properties/[slug], else → home.
  // New listings don't have a slug assigned yet (only seeds do). Pull it.
  const { data: slugRow } = await supabase
    .from('listings')
    .select('slug')
    .eq('id', listingId)
    .single();
  const slug = slugRow?.slug ?? String(listingId);

  // Centralised detail-page router. Automotive → /rides, real-estate →
  // /properties, everything else → /listings (generic). Before the
  // generic fallback existed, non-vertical categories silently
  // redirected to `/` — a supply-loop break.
  const redirectTo = listingDetailHrefFromParent(locale, slug, parentSlug);

  revalidatePath('/sell');
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
