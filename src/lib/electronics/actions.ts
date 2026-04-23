'use server';

import { createClient } from '@/lib/supabase/server';
import { getElectronicsCatalogSearch, type DeviceCatalogRow } from './queries';
import type { ElectronicsCategoryKey } from './types';

/**
 * Wizard-facing server actions for the Electronics vertical.
 *
 * Kept separate from listings/actions.ts because these are all
 * wizard helpers (catalog search, pre-publish IMEI check) — not part
 * of the publish pipeline itself.
 */

// ---------------------------------------------------------------------------
// Catalog search — used by Q1 autocomplete
// ---------------------------------------------------------------------------

export interface CatalogSearchResult {
  rows: DeviceCatalogRow[];
}

export async function searchElectronicsCatalog(
  query: string,
  subCat: ElectronicsCategoryKey | null,
): Promise<CatalogSearchResult> {
  const rows = await getElectronicsCatalogSearch(
    query,
    subCat ?? undefined,
    20,
  );
  return { rows };
}

// ---------------------------------------------------------------------------
// Pre-publish IMEI check — called debounced as seller types the IMEI
// ---------------------------------------------------------------------------

export type ImeiCheckStatus =
  | 'clean'        // no conflict
  | 'own_listing'  // already on seller's own prior listing
  | 'blocked'      // on a different seller's active listing
  | 'unauth'       // seller not signed in
  | 'invalid'      // IMEI fails format sanity
  | 'error';       // DB / RPC failed

/**
 * Check a candidate IMEI against the hashed uniqueness registry.
 *
 * Called by the wizard debounced 500ms per keystroke. Returns one of
 * the status strings above. Plain IMEI is sent once over the wire to
 * this server action, hashed inside the SECURITY DEFINER RPC, and
 * never persisted plain.
 */
export async function checkImeiUnique(imei: string): Promise<ImeiCheckStatus> {
  const normalised = imei.replace(/\s+/g, '').toUpperCase();

  // Format sanity — IMEI is 15 digits; serial numbers vary but we gate
  // at ≥6 characters alphanumeric before bothering the RPC.
  if (!/^[0-9A-Z]{6,20}$/.test(normalised)) return 'invalid';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'unauth';

  const { data, error } = await supabase.rpc('check_electronics_imei_unique', {
    p_imei: normalised,
    p_seller_id: user.id,
  });

  if (error) {
    console.error('[electronics/actions] IMEI check error:', error.message);
    return 'error';
  }
  const result = data as string | null;
  if (result === 'clean' || result === 'own_listing' || result === 'blocked') {
    return result;
  }
  return 'error';
}
