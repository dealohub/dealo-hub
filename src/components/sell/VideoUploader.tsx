'use client';

import { useRef, useState, useTransition, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Trash2, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getVideoDuration,
  uploadDraftVideo,
  deleteDraftVideo,
} from '@/lib/listings/client-upload';
import { saveDraft, ensureDraftId } from '@/lib/listings/actions';

const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MIN_DURATION = 30;
const MAX_DURATION = 120;

interface VideoUploaderProps {
  url: string | null;
  onChange: (next: string | null) => void;
}

export function VideoUploader({ url, onChange }: VideoUploaderProps) {
  const t = useTranslations('sell.step.video');
  const tErr = useTranslations('sell.errors');
  const inputRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_VIDEO_MIME.includes(file.type as (typeof ALLOWED_VIDEO_MIME)[number])) {
      setError('video_invalid_format');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError('video_too_large');
      return;
    }

    let d: number;
    try {
      d = await getVideoDuration(file);
    } catch {
      setError('video_metadata_unreadable');
      return;
    }
    if (d < MIN_DURATION || d > MAX_DURATION) {
      setError('video_duration_out_of_range');
      return;
    }

    startTransition(async () => {
      const ctx = await ensureDraftId();
      if (!ctx.ok) {
        setError('not_authenticated');
        return;
      }
      try {
        const { url: newUrl } = await uploadDraftVideo(ctx.user_id, ctx.draft_id, file);
        if (url) void deleteDraftVideo(url).catch(() => {});
        onChange(newUrl);
        setDuration(Math.round(d));
        await saveDraft({ video_url: newUrl, current_step: 'media' });
      } catch (err) {
        console.error('[video] upload failed:', err);
        setError('upload_failed');
      }
    });
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  function removeVideo() {
    if (!url) return;
    const old = url;
    onChange(null);
    setDuration(null);
    startTransition(async () => {
      await saveDraft({ video_url: null });
    });
    void deleteDraftVideo(old).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-warm-amber/5 border border-warm-amber/25">
        <span
          className="inline-flex items-center justify-center size-10 rounded-xl bg-warm-amber/15 text-warm-amber-700 shrink-0"
          aria-hidden="true"
        >
          <Clapperboard className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <p className="text-body font-medium text-charcoal-ink">{t('headline')}</p>
          <p className="text-body-small text-muted-steel">{t('help')}</p>
        </div>
      </div>

      {isPending && !url && <Skeleton rounded="lg" className="aspect-video" />}

      {url && (
        <div className="relative rounded-2xl overflow-hidden border border-whisper-divider bg-charcoal-ink">
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full aspect-video object-contain"
          />
          <div className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-charcoal-ink/80 text-white text-caption backdrop-blur-sm">
            <Clapperboard className="size-3" strokeWidth={2} />
            <span lang="en">
              {duration != null ? `${duration}s` : t('ready')}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          <span>{url ? t('replace') : t('upload')}</span>
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={removeVideo}>
            <Trash2 className="size-4 text-danger-coral" />
            <span className="text-danger-coral">{t('remove')}</span>
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_VIDEO_MIME.join(',')}
          onChange={onFileChange}
          className="sr-only"
        />
      </div>

      {error && <FormMessage tone="error">{tErr(error)}</FormMessage>}
    </div>
  );
}
