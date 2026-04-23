import { createClient } from './server';

/**
 * Avatar storage helpers.
 *
 * Path convention: `avatars/{user_uuid}/avatar-{timestamp}.webp`
 *   - First path segment MUST match auth.uid() for the upload to pass RLS.
 *   - Timestamped filename defeats browser caching after re-upload.
 */

const AVATARS_BUCKET = 'avatars';

export function avatarObjectPath(userId: string, extension: 'webp' | 'jpg' | 'png' = 'webp'): string {
  const ts = Date.now();
  return `${userId}/avatar-${ts}.${extension}`;
}

/** Upload a blob to the avatars bucket and return its public URL. */
export async function uploadAvatarBlob(
  userId: string,
  blob: Blob,
  extension: 'webp' | 'jpg' | 'png' = 'webp'
): Promise<{ url: string; path: string }> {
  const supabase = await createClient();
  const path = avatarObjectPath(userId, extension);

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, blob, {
    contentType: blob.type || `image/${extension}`,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Best-effort delete of an old avatar object. Never throws — logs + swallows. */
export async function deleteAvatarObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  if (error) console.error('[storage] delete old avatar failed:', error.message);
}

/**
 * Pull the object path out of a Supabase public-URL.
 * Accepts:
 *   https://xxx.supabase.co/storage/v1/object/public/avatars/{uuid}/avatar-123.webp
 * Returns: "{uuid}/avatar-123.webp" (bucket prefix stripped)
 */
export function pathFromPublicUrl(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
