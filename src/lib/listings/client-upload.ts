'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Client-side listing-media upload helpers.
 *
 * The browser resizes to 1920×1920 @ WebP 0.85 before upload. RLS on the
 * `listing-images` / `listing-videos` buckets scopes writes to the caller's
 * `auth.uid()` — the anon key is enough because the Supabase session cookie
 * is attached automatically.
 */

const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 0.85;

export async function resizeImageToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    MAX_IMAGE_DIMENSION / bitmap.width,
    MAX_IMAGE_DIMENSION / bitmap.height,
    1
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-context-unavailable');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('canvas-toBlob-null'))),
      'image/webp',
      WEBP_QUALITY
    );
  });
}

function buildDraftImagePath(userId: string, draftId: string, position: number): string {
  return `${userId}/drafts/${draftId}/image-${position}-${Date.now()}.webp`;
}

export async function uploadDraftImage(
  userId: string,
  draftId: string,
  blob: Blob,
  position: number
): Promise<{ url: string; path: string }> {
  const supabase = createClient();
  const path = buildDraftImagePath(userId, draftId, position);
  const { error } = await supabase.storage.from('listing-images').upload(path, blob, {
    contentType: blob.type || 'image/webp',
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteDraftImage(publicUrl: string): Promise<void> {
  const supabase = createClient();
  const marker = '/storage/v1/object/public/listing-images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from('listing-images').remove([path]);
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('video-metadata-error'));
    };
  });
}

function buildDraftVideoPath(userId: string, draftId: string, ext: string): string {
  return `${userId}/drafts/${draftId}/video-${Date.now()}.${ext}`;
}

export async function uploadDraftVideo(
  userId: string,
  draftId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const supabase = createClient();
  const ext =
    file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4';
  const path = buildDraftVideoPath(userId, draftId, ext);
  const { error } = await supabase.storage.from('listing-videos').upload(path, file, {
    contentType: file.type || 'video/mp4',
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('listing-videos').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteDraftVideo(publicUrl: string): Promise<void> {
  const supabase = createClient();
  const marker = '/storage/v1/object/public/listing-videos/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from('listing-videos').remove([path]);
}
