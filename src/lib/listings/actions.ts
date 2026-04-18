'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

/**
 * publishListing — stubbed for session 1 of BRIEF-003.
 * Full implementation (PublishSchema validation + INSERT listings +
 * listing_images + moveDraftImagesToListing + deleteDraft + redirect) arrives
 * with Steps 6-13 in the next session.
 */
export async function publishListing(): Promise<DraftActionResult> {
  return { ok: false, error: 'not_implemented_yet_session2' };
}
