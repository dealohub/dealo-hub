'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Waitlist submission server action.
 *
 * Public write: anyone can add themselves.
 * Validated server-side with Zod — never trust client.
 * Idempotent: duplicate email returns success (no leak).
 */

// -----------------------------------------------------------------------------
// Validation schema
// -----------------------------------------------------------------------------

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'invalid_email' }).max(254),
  country_code: z.enum(['KW', 'SA', 'AE', 'BH', 'QA', 'OM']).default('KW'),
  preferred_locale: z.enum(['ar', 'en']).default('ar'),
  primary_interest: z
    .enum([
      'electronics',
      'furniture',
      'luxury',
      'baby-kids',
      'games-hobbies',
      'sports-outdoor',
      'home-fitness',
      'home-appliances',
      'beauty',
      'general',
    ])
    .optional()
    .nullable(),
  is_seller: z.coerce.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Action result types
// -----------------------------------------------------------------------------

export type WaitlistResult =
  | { ok: true; alreadyExists: boolean }
  | { ok: false; error: 'invalid_email' | 'rate_limited' | 'server_error'; fieldErrors?: Record<string, string[]> };

// -----------------------------------------------------------------------------
// Main action
// -----------------------------------------------------------------------------

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  // Parse form data
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    country_code: (formData.get('country_code')?.toString() ?? 'KW').toUpperCase(),
    preferred_locale: formData.get('preferred_locale')?.toString() ?? 'ar',
    primary_interest: formData.get('primary_interest')?.toString() || null,
    is_seller: formData.get('is_seller') === 'on' || formData.get('is_seller') === 'true',
  };

  // Validate
  const parsed = WaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid_email',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Insert
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('waitlist').insert({
      email: data.email,
      country_code: data.country_code,
      preferred_locale: data.preferred_locale,
      primary_interest: data.primary_interest,
      is_seller: data.is_seller,
      is_buyer: true,
    });

    // Duplicate email → return success (don't leak whether email is on list)
    if (error) {
      if (error.code === '23505') {
        // UNIQUE violation
        return { ok: true, alreadyExists: true };
      }
      console.error('[waitlist] Insert error:', error);
      return { ok: false, error: 'server_error' };
    }

    return { ok: true, alreadyExists: false };
  } catch (err) {
    console.error('[waitlist] Unexpected error:', err);
    return { ok: false, error: 'server_error' };
  }
}
