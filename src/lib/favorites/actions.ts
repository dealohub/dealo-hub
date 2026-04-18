'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ToggleFavoriteResult =
  | { ok: true; isSaved: boolean }
  | { ok: false; error: 'unauthenticated' | 'failed' };

/**
 * Toggle a listing on the signed-in user's favorites list.
 *
 * Counter columns (`listings.save_count`) are maintained by DB triggers on
 * `favorites`, so this action only upserts/deletes the row.
 */
export async function toggleFavorite(listingId: number): Promise<ToggleFavoriteResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'unauthenticated' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    if (error) return { ok: false, error: 'failed' };
    revalidatePath('/saved');
    return { ok: true, isSaved: false };
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, listing_id: listingId });
  if (error) return { ok: false, error: 'failed' };
  revalidatePath('/saved');
  return { ok: true, isSaved: true };
}
