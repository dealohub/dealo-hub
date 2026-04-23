import { createClient } from './server';

/**
 * Listing-media storage helpers (server-side).
 *
 * Path conventions:
 *   Images:   {user_uuid}/drafts/{draft_id}/image-{position}-{timestamp}.webp
 *             {user_uuid}/listings/{listing_id}/image-{position}-{timestamp}.webp
 *   Videos:   {user_uuid}/drafts/{draft_id}/video-{timestamp}.{ext}
 *             {user_uuid}/listings/{listing_id}/video-{timestamp}.{ext}
 *
 * On publish, the client-side upload path is rewritten from `drafts/{draftId}`
 * to `listings/{listingId}` via a storage MOVE (cheaper than re-upload).
 */

export const LISTING_IMAGES_BUCKET = 'listing-images';
export const LISTING_VIDEOS_BUCKET = 'listing-videos';

export function draftImagePath(userId: string, draftId: string, position: number): string {
  return `${userId}/drafts/${draftId}/image-${position}-${Date.now()}.webp`;
}

export function listingImagePath(userId: string, listingId: number, position: number): string {
  return `${userId}/listings/${listingId}/image-${position}-${Date.now()}.webp`;
}

export function draftVideoPath(
  userId: string,
  draftId: string,
  ext: 'mp4' | 'webm' | 'mov' = 'mp4'
): string {
  return `${userId}/drafts/${draftId}/video-${Date.now()}.${ext}`;
}

export function listingVideoPath(
  userId: string,
  listingId: number,
  ext: 'mp4' | 'webm' | 'mov' = 'mp4'
): string {
  return `${userId}/listings/${listingId}/video-${Date.now()}.${ext}`;
}

/** Upload a pre-resized listing image blob (client should already have converted to WebP). */
export async function uploadListingImageBlob(
  path: string,
  blob: Blob
): Promise<{ url: string; path: string }> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/webp',
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function uploadListingVideoBlob(
  path: string,
  blob: Blob
): Promise<{ url: string; path: string }> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(LISTING_VIDEOS_BUCKET).upload(path, blob, {
    contentType: blob.type || 'video/mp4',
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(LISTING_VIDEOS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteListingImageObjects(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(paths);
  if (error) console.error('[storage-listings] image remove failed:', error.message);
}

export async function deleteListingVideoObjects(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(LISTING_VIDEOS_BUCKET).remove(paths);
  if (error) console.error('[storage-listings] video remove failed:', error.message);
}

/** Move uploaded draft objects to their final `listings/{id}/...` path on publish. */
export async function moveDraftImagesToListing(
  userId: string,
  draftId: string,
  listingId: number,
  urls: string[]
): Promise<string[]> {
  const supabase = await createClient();
  const next: string[] = [];
  const draftPrefix = `${userId}/drafts/${draftId}/`;
  const listingPrefix = `${userId}/listings/${listingId}/`;

  for (const url of urls) {
    const marker = `/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) {
      next.push(url); // external URL — leave as-is
      continue;
    }
    const oldPath = url.slice(idx + marker.length);
    if (!oldPath.startsWith(draftPrefix)) {
      next.push(url);
      continue;
    }
    const newPath = listingPrefix + oldPath.slice(draftPrefix.length);
    const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).move(oldPath, newPath);
    if (error) {
      console.error('[storage-listings] move failed:', error.message, { oldPath, newPath });
      next.push(url); // fall back to original path if move fails
      continue;
    }
    const { data } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(newPath);
    next.push(data.publicUrl);
  }

  return next;
}
