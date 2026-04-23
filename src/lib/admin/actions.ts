'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin-side listing moderation actions.
 *
 * Each action:
 *   1. Validates input with zod.
 *   2. Calls the corresponding SECURITY DEFINER RPC from migration 0042.
 *      The RPC runs `public.assert_admin()` itself — we do NOT re-check
 *      here on the server, because the RPC is the authoritative gate and
 *      a double-check would drift over time. If a non-admin invokes this
 *      action the RPC raises `unauthorized` and we surface it.
 *   3. Revalidates `/admin/listings` paths (and the public listing page if
 *      applicable) so badge counts + table rows refresh.
 *
 * Bulk variants walk the array server-side (one RPC call per row). A true
 * batch RPC would be nicer at scale; Phase 9c can add it if bulk sizes ever
 * exceed ~50. For 9a the UI caps selection at 100, and one round-trip per
 * listing is perfectly fine.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminActionResult =
  | { ok: true }
  | {
      ok: false;
      error: 'not_authenticated' | 'unauthorized' | 'invalid_input' | 'rpc_failed';
      message?: string;
    };

export interface BulkResult {
  ok: boolean;
  successes: number;
  failures: Array<{ id: number; error: string }>;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const ListingIdSchema = z.number().int().positive();
const RejectReasonSchema = z.string().trim().min(3).max(500);
const BulkIdsSchema = z.array(ListingIdSchema).min(1).max(100);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Map Supabase RPC error -> AdminActionResult.
 * Postgres code `42501` = insufficient_privilege (our `unauthorized`).
 * Any other error becomes `rpc_failed`.
 */
function mapRpcError(error: { code?: string; message: string }): AdminActionResult {
  if (error.code === '42501' || error.message.includes('unauthorized')) {
    return { ok: false, error: 'unauthorized' };
  }
  return { ok: false, error: 'rpc_failed', message: error.message };
}

function revalidateAdmin() {
  revalidatePath('/[locale]/admin', 'layout');
  revalidatePath('/[locale]/admin/listings', 'page');
}

// ---------------------------------------------------------------------------
// Single-listing actions
// ---------------------------------------------------------------------------

export async function approveListing(
  listingId: number
): Promise<AdminActionResult> {
  const parsed = ListingIdSchema.safeParse(listingId);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    'admin_approve_listing' as never,
    { p_listing_id: parsed.data } as never
  );

  if (error) return mapRpcError(error);

  revalidateAdmin();
  return { ok: true };
}

export async function rejectListing(
  listingId: number,
  reason: string
): Promise<AdminActionResult> {
  const parsedId = ListingIdSchema.safeParse(listingId);
  const parsedReason = RejectReasonSchema.safeParse(reason);
  if (!parsedId.success || !parsedReason.success) {
    return { ok: false, error: 'invalid_input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    'admin_reject_listing' as never,
    {
      p_listing_id: parsedId.data,
      p_reason: parsedReason.data,
    } as never
  );

  if (error) return mapRpcError(error);

  revalidateAdmin();
  return { ok: true };
}

export async function holdListing(
  listingId: number
): Promise<AdminActionResult> {
  const parsed = ListingIdSchema.safeParse(listingId);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    'admin_hold_listing' as never,
    { p_listing_id: parsed.data } as never
  );

  if (error) return mapRpcError(error);

  revalidateAdmin();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bulk variants
// ---------------------------------------------------------------------------

export async function bulkApproveListings(
  listingIds: number[]
): Promise<BulkResult> {
  const parsed = BulkIdsSchema.safeParse(listingIds);
  if (!parsed.success) {
    return { ok: false, successes: 0, failures: [] };
  }

  const supabase = await createClient();
  const failures: BulkResult['failures'] = [];
  let successes = 0;

  for (const id of parsed.data) {
    const { error } = await supabase.rpc(
      'admin_approve_listing' as never,
      { p_listing_id: id } as never
    );
    if (error) {
      failures.push({ id, error: error.message });
    } else {
      successes++;
    }
  }

  revalidateAdmin();
  return { ok: failures.length === 0, successes, failures };
}

export async function bulkHoldListings(
  listingIds: number[]
): Promise<BulkResult> {
  const parsed = BulkIdsSchema.safeParse(listingIds);
  if (!parsed.success) {
    return { ok: false, successes: 0, failures: [] };
  }

  const supabase = await createClient();
  const failures: BulkResult['failures'] = [];
  let successes = 0;

  for (const id of parsed.data) {
    const { error } = await supabase.rpc(
      'admin_hold_listing' as never,
      { p_listing_id: id } as never
    );
    if (error) {
      failures.push({ id, error: error.message });
    } else {
      successes++;
    }
  }

  revalidateAdmin();
  return { ok: failures.length === 0, successes, failures };
}

export async function bulkRejectListings(
  listingIds: number[],
  reason: string
): Promise<BulkResult> {
  const parsedIds = BulkIdsSchema.safeParse(listingIds);
  const parsedReason = RejectReasonSchema.safeParse(reason);
  if (!parsedIds.success || !parsedReason.success) {
    return { ok: false, successes: 0, failures: [] };
  }

  const supabase = await createClient();
  const failures: BulkResult['failures'] = [];
  let successes = 0;

  for (const id of parsedIds.data) {
    const { error } = await supabase.rpc(
      'admin_reject_listing' as never,
      {
        p_listing_id: id,
        p_reason: parsedReason.data,
      } as never
    );
    if (error) {
      failures.push({ id, error: error.message });
    } else {
      successes++;
    }
  }

  revalidateAdmin();
  return { ok: failures.length === 0, successes, failures };
}
