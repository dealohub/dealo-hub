'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  uploadAvatarBlob,
  deleteAvatarObject,
  pathFromPublicUrl,
} from '@/lib/supabase/storage';
import {
  ProfileUpdateSchema,
  AvatarFileSchema,
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  type ProfileUpdateInput,
} from './validators';
import { checkHandleAvailability, type HandleAvailabilityResult } from './queries';

/**
 * Profile server actions.
 * All actions return a plain result object — forms map error codes to i18n keys.
 */

export type ProfileActionResult =
  | { ok: true; message?: string; data?: { avatar_url?: string; handle?: string | null } }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in out)) out[key] = issue.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

export async function updateProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const parsed = ProfileUpdateSchema.safeParse({
    display_name: formData.get('display_name'),
    handle: formData.get('handle'),
    bio: formData.get('bio'),
    preferred_locale: formData.get('preferred_locale'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation_failed', fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const { display_name, handle, bio, preferred_locale } = parsed.data;

  // If handle is being changed, re-check availability server-side.
  // RLS + UNIQUE(handle) on the table is the hard guard; this gives us a friendly message first.
  if (handle) {
    const check = await checkHandleAvailability(handle, user.id);
    if (!check.available) {
      return {
        ok: false,
        error: 'validation_failed',
        fieldErrors: {
          handle: check.reason === 'reserved' ? 'handle_reserved' : 'handle_taken',
        },
      };
    }
  }

  const payload: Partial<ProfileUpdateInput> & { updated_at: string } = {
    display_name,
    handle,
    bio,
    preferred_locale,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);

  if (error) {
    // Postgres 23505 → UNIQUE violation on handle (race with another writer).
    if ((error as { code?: string }).code === '23505') {
      return { ok: false, error: 'validation_failed', fieldErrors: { handle: 'handle_taken' } };
    }
    console.error('[profile] updateProfile error:', error.message);
    return { ok: false, error: 'update_failed' };
  }

  // Invalidate both the owner's profile surfaces and the (possibly new) public URL.
  revalidatePath('/profile/me');
  revalidatePath('/profile/edit');
  if (handle) revalidatePath(`/profile/${handle}`);
  revalidatePath(`/profile/u/${user.id}`);

  return { ok: true, data: { handle: handle ?? null } };
}

// ---------------------------------------------------------------------------
// uploadAvatar
// ---------------------------------------------------------------------------

export async function uploadAvatar(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const file = formData.get('avatar');
  if (!(file instanceof File)) {
    return { ok: false, error: 'validation_failed', fieldErrors: { avatar: 'avatar_missing' } };
  }

  const validated = AvatarFileSchema.safeParse({ size: file.size, type: file.type });
  if (!validated.success) {
    return { ok: false, error: 'validation_failed', fieldErrors: fieldErrorsFromZod(validated.error) };
  }

  // Map mime → extension for the object path.
  const ext =
    file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';

  // Read current avatar URL so we can clean up the old object after the new one lands.
  const { data: profileBefore } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  let uploadResult: { url: string; path: string };
  try {
    uploadResult = await uploadAvatarBlob(user.id, file, ext);
  } catch (err) {
    console.error('[profile] uploadAvatar storage error:', err);
    return { ok: false, error: 'upload_failed' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: uploadResult.url, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    // Try to roll back the object so we don't orphan storage on a failed DB update.
    await deleteAvatarObject(uploadResult.path);
    console.error('[profile] uploadAvatar DB update error:', error.message);
    return { ok: false, error: 'upload_failed' };
  }

  // Best-effort cleanup of the old file (don't fail the action on cleanup errors).
  const oldPath = pathFromPublicUrl(profileBefore?.avatar_url);
  if (oldPath && oldPath !== uploadResult.path) {
    await deleteAvatarObject(oldPath);
  }

  revalidatePath('/profile/me');
  revalidatePath('/profile/edit');

  return { ok: true, data: { avatar_url: uploadResult.url } };
}

// ---------------------------------------------------------------------------
// checkHandleAvailabilityAction — called (debounced) from HandleInput
// ---------------------------------------------------------------------------

export async function checkHandleAvailabilityAction(
  handle: string
): Promise<HandleAvailabilityResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return checkHandleAvailability(handle, user?.id);
}

// ---------------------------------------------------------------------------
// Re-exports for edge constants (useful to client)
// ---------------------------------------------------------------------------

export async function getAvatarConstraints() {
  return { maxBytes: AVATAR_MAX_BYTES, allowedMime: AVATAR_ALLOWED_MIME };
}
