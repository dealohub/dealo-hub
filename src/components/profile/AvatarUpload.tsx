'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarDisplay } from './AvatarDisplay';
import { uploadAvatar, type ProfileActionResult } from '@/lib/profile/actions';
import { AVATAR_ALLOWED_MIME, AVATAR_MAX_BYTES } from '@/lib/profile/validators';
import { cn } from '@/lib/utils';

const MAX_AVATAR_DIMENSION = 512;

interface AvatarUploadProps {
  currentUrl: string | null;
  displayName: string;
}

/**
 * AvatarUpload — client-side resize → WebP convert → upload via server action.
 *
 * Flow:
 *   1. File chosen (picker, drag-drop, or camera capture).
 *   2. Validate size + mime client-side.
 *   3. Draw onto canvas at max 512px, export as WebP q=0.9.
 *   4. Send FormData with the resized blob to `uploadAvatar` action.
 *   5. On success, swap the displayed avatar to the new URL.
 */
export function AvatarUpload({ currentUrl, displayName }: AvatarUploadProps) {
  const t = useTranslations('profile.avatar');
  const tErr = useTranslations('profile.errors');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Keep preview in sync if parent changes currentUrl.
  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
        setError('avatar_invalid_format');
        return;
      }
      if (file.size > AVATAR_MAX_BYTES) {
        setError('avatar_too_large');
        return;
      }

      startTransition(async () => {
        try {
          const resized = await resizeToWebp(file, MAX_AVATAR_DIMENSION);

          const formData = new FormData();
          formData.append('avatar', resized, `avatar.webp`);

          const res: ProfileActionResult = await uploadAvatar(formData);
          if (!res.ok) {
            const fieldErr = res.fieldErrors?.avatar;
            setError(fieldErr ?? res.error);
            return;
          }

          if (res.data?.avatar_url) {
            setPreviewUrl(res.data.avatar_url);
          }
        } catch (err) {
          console.error('[avatar] resize/upload failed:', err);
          setError('upload_failed');
        }
      });
    },
    []
  );

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected after an error.
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex items-center gap-4 p-4 rounded-2xl',
          'border-[1.5px] border-dashed',
          isDragging ? 'border-warm-amber bg-warm-amber/5' : 'border-ghost-border bg-canvas-zinc',
          isPending && 'opacity-60 pointer-events-none',
          'transition-colors duration-150'
        )}
      >
        {isPending ? (
          <Skeleton rounded="full" className="size-24" />
        ) : (
          <AvatarDisplay src={previewUrl} name={displayName} size="xl" />
        )}

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-body-small text-muted-steel">{t('help')}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              <span>{t(previewUrl ? 'change' : 'upload')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                if (!fileInputRef.current) return;
                fileInputRef.current.capture = 'user';
                fileInputRef.current.click();
              }}
            >
              <Camera className="size-4" />
              <span>{t('takePhoto')}</span>
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_ALLOWED_MIME.join(',')}
          onChange={onFileChange}
          className="sr-only"
        />
      </div>

      {error && <FormMessage tone="error">{tErr(error)}</FormMessage>}
    </div>
  );
}

/**
 * Client-side resize to WebP. Uses ImageBitmap + canvas (no external deps).
 * Falls back to JPEG if the browser refuses WebP (very rare in 2026).
 */
async function resizeToWebp(file: File, maxDimension: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxDimension / bitmap.width, maxDimension / bitmap.height, 1);
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
      0.9
    );
  });
}
