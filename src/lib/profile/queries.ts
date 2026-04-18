import { cache } from 'react';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { RESERVED_HANDLES } from './validators';

/**
 * Profile queries.
 *
 * 🔒 Decision 2 enforcement: public profile selects NEVER include `phone_e164`
 * or `email`. Only the owner-facing `getCurrentProfile` may return those.
 */

const PUBLIC_PROFILE_COLUMNS = [
  'id',
  'display_name',
  'handle',
  'avatar_url',
  'bio',
  'country_code',
  'preferred_locale',
  'phone_verified_at', // boolean-ish signal only; actual number never exposed
  'id_verified_at',
  'is_founding_partner',
  'rating_avg',
  'rating_count',
  'active_listings_count',
  'sold_listings_count',
  'created_at',
].join(', ');

export type PublicProfile = {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  country_code: string;
  preferred_locale: string;
  phone_verified_at: string | null;
  id_verified_at: string | null;
  is_founding_partner: boolean;
  rating_avg: number | null;
  rating_count: number;
  active_listings_count: number;
  sold_listings_count: number;
  created_at: string;
};

/** Look up a profile by its public handle. Returns null if not found or banned. */
export const getProfileByHandle = cache(async (handle: string): Promise<PublicProfile | null> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('handle', handle.toLowerCase())
    .eq('is_banned', false)
    .maybeSingle();

  return (data as PublicProfile | null) ?? null;
});

/** Fallback lookup for users without a handle — visible via /profile/u/[uuid]. */
export const getProfileByUuid = cache(async (uuid: string): Promise<PublicProfile | null> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', uuid)
    .eq('is_banned', false)
    .maybeSingle();

  return (data as PublicProfile | null) ?? null;
});

/** Full current-user profile — safe to return email here since it's owner-only. */
export const getCurrentProfile = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return data;
});

export type HandleAvailabilityResult =
  | { available: true }
  | { available: false; reason: 'taken' | 'reserved' | 'invalid' };

/** Service-role check used by debounced handle input. */
export async function checkHandleAvailability(
  handle: string,
  currentUserId?: string
): Promise<HandleAvailabilityResult> {
  const normalized = handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return { available: false, reason: 'invalid' };
  }
  if (RESERVED_HANDLES.has(normalized)) {
    return { available: false, reason: 'reserved' };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('handle', normalized)
    .maybeSingle();

  if (!data) return { available: true };
  if (currentUserId && data.id === currentUserId) return { available: true };
  return { available: false, reason: 'taken' };
}
