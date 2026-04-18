'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { moveDraftImagesToListing } from '@/lib/supabase/storage-listings';
import { generateListingEmbedding } from './embeddings';
import { PublishSchema } from './validators';
import type { DraftState, WizardStep } from './draft';

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

  revalidatePath('/sell');
  revalidatePath(`/listings/${listingId}`);
  redirect(`/${locale}/listings/${listingId}`);
}
