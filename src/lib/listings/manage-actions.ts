'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { canPerform, type ListingStatus } from './manage-transitions';

/**
 * Seller-side listing-management actions.
 *
 * Until this module landed, a seller could publish but not curate
 * their own inventory:
 *   • A typo in a published listing required delete-and-republish
 *     (losing save_count, view_count, slug stability).
 *   • A sold item stayed in the live grid forever, wasting buyer
 *     attention on something unavailable.
 *   • There was no way to take a listing offline temporarily
 *     (vacation mode, awaiting more photos, etc.).
 *
 * Four primitives:
 *   • markListingSold       — status 'sold'.
 *   • archiveListing        — status 'archived' (recoverable).
 *   • republishListing      — status 'live' (recover from sold/archived).
 *   • softDeleteListing     — status 'deleted' + archived_at +
 *                             soft_deleted_at. Recoverable via support;
 *                             not user-recoverable from the UI.
 *
 * RLS already restricts every UPDATE/DELETE to `auth.uid() = seller_id`
 * (policies `sellers_update_own_listings` + `sellers_delete_own_listings`
 * verified via direct DB query 2026-04-21). Each action still validates
 * ownership server-side as defence-in-depth — even though RLS would
 * silently no-op a wrong-seller request, an explicit check lets us
 * surface a clean error message instead of an empty result.
 *
 * Postgres `chk_archived_status` constraint requires `archived_at` to
 * be NULL when status not in ('archived','deleted') and NOT NULL when
 * it is. Each action enforces the matching update so the constraint
 * never trips.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

const ListingIdSchema = z.number().int().positive();

export type ManageActionResult =
  | { ok: true }
  | { ok: false; error: 'not_authenticated' | 'not_owner' | 'not_found' | 'invalid_state' | 'update_failed' };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Verify that the signed-in user owns the given listing AND read its
 * current status. Returns the row on success, an error code otherwise.
 *
 * Uses the RLS-respecting client — `sellers_read_own_listings` policy
 * makes own-listings visible, `public_read_live_listings` makes other
 * sellers' live listings visible. We filter by seller_id explicitly to
 * surface `not_owner` instead of `not_found` for foreign listings.
 */
async function loadOwnListing(listingId: number) {
  const parsed = ListingIdSchema.safeParse(listingId);
  if (!parsed.success) {
    return { ok: false as const, error: 'not_found' as const };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'not_authenticated' as const };

  const { data, error } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', parsed.data)
    .maybeSingle();

  if (error) {
    console.error('[listings/manage] load error:', error.message);
    return { ok: false as const, error: 'update_failed' as const };
  }
  if (!data) return { ok: false as const, error: 'not_found' as const };
  if ((data as any).seller_id !== user.id) {
    return { ok: false as const, error: 'not_owner' as const };
  }

  return {
    ok: true as const,
    supabase,
    user,
    listing: {
      id: (data as any).id as number,
      seller_id: (data as any).seller_id as string,
      status: (data as any).status as string,
    },
  };
}

function revalidateAfterChange(listingId: number) {
  // The listing may live under any of the three detail routes — we
  // don't know its category here, so blast the three plus the
  // owner-side surfaces. ISR pages refetch on next visit.
  revalidatePath('/my-listings');
  revalidatePath(`/rides/${listingId}`);
  revalidatePath(`/properties/${listingId}`);
  revalidatePath(`/listings/${listingId}`);
  revalidatePath('/');
}

// ---------------------------------------------------------------------------
// Mark sold
// ---------------------------------------------------------------------------

/**
 * Mark a listing as sold. Hides it from the public grid (RLS gate
 * `status='live'`) but keeps it reachable by direct link for the
 * seller's audit trail + buyer's "did I really see this?" check.
 *
 * Allowed source states: live, archived. (Drafts can't be sold —
 * they were never live; held/rejected/deleted are terminal upstream.)
 */
export async function markListingSold(listingId: number): Promise<ManageActionResult> {
  const ctx = await loadOwnListing(listingId);
  if (!ctx.ok) return ctx;
  if (!canPerform('mark_sold', ctx.listing.status as ListingStatus)) {
    return { ok: false, error: 'invalid_state' };
  }

  const { error } = await ctx.supabase
    .from('listings')
    .update({
      status: 'sold',
      // chk_archived_status: archived_at NULL when status not in archived/deleted.
      archived_at: null,
    })
    .eq('id', listingId);

  if (error) {
    console.error('[listings/manage] markSold error:', error.message);
    return { ok: false, error: 'update_failed' };
  }
  revalidateAfterChange(listingId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

/**
 * Archive a listing — hides it from the public grid, preserves all
 * data (counters, images, conversations). Reversible via
 * `republishListing`.
 *
 * Allowed source states: live, sold. Skipped if already archived.
 */
export async function archiveListing(listingId: number): Promise<ManageActionResult> {
  const ctx = await loadOwnListing(listingId);
  if (!ctx.ok) return ctx;
  if (!canPerform('archive', ctx.listing.status as ListingStatus)) {
    return { ok: false, error: 'invalid_state' };
  }

  const { error } = await ctx.supabase
    .from('listings')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  if (error) {
    console.error('[listings/manage] archive error:', error.message);
    return { ok: false, error: 'update_failed' };
  }
  revalidateAfterChange(listingId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Republish (un-archive / un-sold)
// ---------------------------------------------------------------------------

/**
 * Restore an archived or sold listing back to live. Only allowed when
 * the listing is not yet `expires_at`-past. The expiry check happens
 * server-side; if expired, the seller needs to extend (a future
 * action — for now we surface `invalid_state`).
 *
 * Allowed source states: archived, sold.
 */
export async function republishListing(listingId: number): Promise<ManageActionResult> {
  const ctx = await loadOwnListing(listingId);
  if (!ctx.ok) return ctx;
  if (!canPerform('republish', ctx.listing.status as ListingStatus)) {
    return { ok: false, error: 'invalid_state' };
  }

  const { error } = await ctx.supabase
    .from('listings')
    .update({
      status: 'live',
      archived_at: null,
    })
    .eq('id', listingId);

  if (error) {
    console.error('[listings/manage] republish error:', error.message);
    return { ok: false, error: 'update_failed' };
  }
  revalidateAfterChange(listingId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Soft-delete
// ---------------------------------------------------------------------------

/**
 * Soft-delete a listing. Status flips to 'deleted', archived_at +
 * soft_deleted_at are stamped. The row stays in the database for
 * support recovery + audit but is invisible to public reads (RLS),
 * to search (`getFilteredListings` filters `soft_deleted_at IS NULL`),
 * and to the seller's own /my-listings page (we filter `deleted` out
 * client-side).
 *
 * Hard delete is intentionally NOT exposed — a hard delete would
 * cascade into ai_message_log, conversations, messages and break
 * the buyer's record of the negotiation. Support can hard-delete
 * via service-role if a legal request requires it.
 *
 * Allowed from: any non-deleted state.
 */
export async function softDeleteListing(listingId: number): Promise<ManageActionResult> {
  const ctx = await loadOwnListing(listingId);
  if (!ctx.ok) return ctx;
  if (!canPerform('soft_delete', ctx.listing.status as ListingStatus)) {
    return { ok: false, error: 'invalid_state' };
  }

  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from('listings')
    .update({
      status: 'deleted',
      archived_at: now,
      soft_deleted_at: now,
    })
    .eq('id', listingId);

  if (error) {
    console.error('[listings/manage] softDelete error:', error.message);
    return { ok: false, error: 'update_failed' };
  }
  revalidateAfterChange(listingId);
  return { ok: true };
}
