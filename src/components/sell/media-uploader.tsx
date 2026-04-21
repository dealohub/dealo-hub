'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Camera,
  X,
  ArrowRight,
  Loader2,
  Star,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import {
  resizeImageToWebp,
  uploadDraftImage,
  deleteDraftImage,
} from '@/lib/listings/client-upload';

/**
 * MediaUploader — Step 2 of /sell.
 *
 * Drag-drop or tap-to-select. Each selected file is client-resized to
 * 1920px WebP (canvas-based in client-upload.ts), then uploaded to
 * Supabase Storage under `{user_id}/drafts/{draft_id}/image-N-TS.webp`.
 * On publish, `moveDraftImagesToListing` promotes them to the listing
 * folder — see src/lib/listings/actions.ts.
 *
 * Continue gate: minimum 5 photos (PublishSchema requirement). Luxury
 * sub-cats need 8 minimum — this component receives `minPhotos` from
 * the page based on category taxonomy.
 *
 * First photo = cover (star badge). Remove + reorder are per-item
 * actions. No drag reorder in V1 (Phase 5b.3) — users re-upload if
 * they want a different cover.
 */

interface Props {
  locale: 'ar' | 'en';
  userId: string;
  draftId: string;
  initialUrls: string[];
  minPhotos: number;
  maxPhotos: number;
}

interface Photo {
  url: string;
  uploading?: boolean;
  error?: string;
  id: string; // stable local id for reorder
}

function urlToPhoto(url: string): Photo {
  return { url, id: url };
}

export default function MediaUploader({
  locale,
  userId,
  draftId,
  initialUrls,
  minPhotos,
  maxPhotos,
}: Props) {
  const t = useTranslations('sell.step.media');
  const tErrors = useTranslations('sell.errors');
  const tNav = useTranslations('sell.nav');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<Photo[]>(initialUrls.map(urlToPhoto));
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ready = photos.filter(p => !p.uploading && !p.error).length >= minPhotos;
  const moreNeeded = Math.max(0, minPhotos - photos.filter(p => !p.error).length);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGenericError(null);

    const incoming = Array.from(files);
    const room = maxPhotos - photos.length;
    const toUpload = incoming.slice(0, room);
    if (incoming.length > room) {
      setGenericError(tErrors('too_many'));
    }

    const placeholderId = () => `tmp-${Math.random().toString(36).slice(2, 9)}`;

    // Optimistically add placeholder entries
    const placeholders: Photo[] = toUpload.map(() => ({
      id: placeholderId(),
      url: '',
      uploading: true,
    }));
    setPhotos(prev => [...prev, ...placeholders]);

    const startIdx = photos.length;
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const position = startIdx + i;
      const phId = placeholders[i].id;
      try {
        const blob = await resizeImageToWebp(file);
        const { url } = await uploadDraftImage(userId, draftId, blob, position);
        setPhotos(prev =>
          prev.map(p => (p.id === phId ? { ...p, url, id: url, uploading: false } : p)),
        );
      } catch (err) {
        console.error('[sell/media] upload failed:', err);
        setPhotos(prev =>
          prev.map(p =>
            p.id === phId
              ? { ...p, uploading: false, error: tErrors('upload_failed') }
              : p,
          ),
        );
      }
    }

    // Persist URLs to draft row after all uploads settle
    setTimeout(() => {
      persistUrlsSnapshot();
    }, 200);
  }

  async function persistUrlsSnapshot() {
    setPhotos(prev => {
      const urls = prev.filter(p => !p.uploading && !p.error && p.url).map(p => p.url);
      void saveDraft({ image_urls: urls, current_step: 'media' }).catch(() => {
        /* debounced; silent fail */
      });
      return prev;
    });
  }

  async function handleRemove(photo: Photo) {
    if (photo.uploading) return;
    // Remove from UI immediately
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    // Best-effort delete from storage (ignored failures)
    try {
      if (photo.url) await deleteDraftImage(photo.url);
    } catch {
      /* silent */
    }
    setTimeout(() => persistUrlsSnapshot(), 100);
  }

  function handleContinue() {
    if (!ready) return;
    setGenericError(null);
    startTransition(async () => {
      const urls = photos.filter(p => !p.uploading && !p.error).map(p => p.url);
      const result = await saveDraft({
        image_urls: urls,
        current_step: 'details',
      });
      if (!result.ok) {
        setGenericError(result.error);
        return;
      }
      router.push(`/${locale}/sell/details`);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {t('headline', { min: minPhotos, max: maxPhotos })}
        </h3>
        <p className="mt-1 text-xs text-foreground/60">{t('help')}</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg bg-foreground/5 ring-1 ring-border/60"
          >
            {photo.uploading ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-primary/5 text-xs text-primary">
                <Loader2 size={18} className="animate-spin" />
                <span>{t('saving')}</span>
              </div>
            ) : photo.error ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-rose-500/10 p-2 text-center text-[10px] text-rose-500">
                <AlertTriangle size={16} />
                <span>{photo.error}</span>
              </div>
            ) : (
              <>
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 200px, 50vw"
                  className="object-cover"
                />
                {idx === 0 && (
                  <span className="absolute start-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground backdrop-blur">
                    <Star size={10} strokeWidth={3} />
                    {t('cover')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(photo)}
                  aria-label={t('remove')}
                  className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground/80 opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        ))}

        {/* Add tile */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-background text-xs text-foreground/60 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            {photos.length === 0 ? (
              <>
                <Upload size={20} />
                <span>{t('addFirst')}</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>{t('add')}</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={e => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Status line */}
      <div className="rounded-lg bg-foreground/5 p-3 text-xs">
        {ready ? (
          <p className="font-medium text-emerald-600 dark:text-emerald-400">
            ✓ {t('readyToContinue')}
          </p>
        ) : (
          <p className="text-foreground/60">{t('moreNeeded', { more: moreNeeded })}</p>
        )}
      </div>

      {genericError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {genericError}
        </div>
      )}

      <div className="flex justify-end border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!ready || isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              {tNav('continue')}
              <ArrowRight size={14} className="rtl:rotate-180" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
