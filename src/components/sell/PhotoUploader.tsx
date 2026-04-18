'use client';

import {
  useCallback,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { Camera, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Skeleton } from '@/components/ui/skeleton';
import {
  resizeImageToWebp,
  uploadDraftImage,
  deleteDraftImage,
} from '@/lib/listings/client-upload';
import { saveDraft, ensureDraftId } from '@/lib/listings/actions';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  urls: string[];
  onChange: (next: string[]) => void;
  minPhotos: number;
  maxPhotos?: number;
}

const ALLOWED_MIME = ['image/webp', 'image/jpeg', 'image/png'] as const;
const MAX_INPUT_BYTES = 12 * 1024 * 1024; // 12 MB source cap

/**
 * PhotoUploader — drag/drop + camera + reorder + delete.
 *
 * State is lifted to the parent: parent owns `urls`, passes `onChange`.
 * This lets Step 2 page gate Continue on min-photo count without polling DOM.
 */
export function PhotoUploader({ urls, onChange, minPhotos, maxPhotos = 10 }: PhotoUploaderProps) {
  const t = useTranslations('sell.step.media');
  const tErr = useTranslations('sell.errors');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const ctxRef = useRef<{ user_id: string; draft_id: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  async function ensureCtx() {
    if (ctxRef.current) return ctxRef.current;
    const res = await ensureDraftId();
    if (!res.ok) throw new Error(res.error);
    ctxRef.current = { user_id: res.user_id, draft_id: res.draft_id };
    return ctxRef.current;
  }

  const persistUrls = useCallback((next: string[]) => {
    startSaving(async () => {
      await saveDraft({ image_urls: next, current_step: 'media' });
    });
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const list = Array.from(files);
      if (!list.length) return;

      const remaining = maxPhotos - urls.length - pendingCount;
      if (remaining <= 0) {
        setError('too_many');
        return;
      }

      const ctx = await ensureCtx().catch(() => null);
      if (!ctx) {
        setError('not_authenticated');
        return;
      }

      const accepted = list.slice(0, remaining);
      let current = [...urls];

      for (const file of accepted) {
        if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
          setError('invalid_format');
          continue;
        }
        if (file.size > MAX_INPUT_BYTES) {
          setError('too_large');
          continue;
        }

        setPendingCount(c => c + 1);
        try {
          const resized = await resizeImageToWebp(file);
          const position = current.length;
          const { url } = await uploadDraftImage(ctx.user_id, ctx.draft_id, resized, position);
          current = [...current, url];
          onChange(current);
          persistUrls(current);
        } catch (err) {
          console.error('[photo] upload failed:', err);
          setError('upload_failed');
        } finally {
          setPendingCount(c => Math.max(0, c - 1));
        }
      }
    },
    [urls, pendingCount, maxPhotos, onChange, persistUrls]
  );

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length) void handleFiles(files);
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length) void handleFiles(files);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = urls.indexOf(active.id as string);
    const newIndex = urls.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(urls, oldIndex, newIndex);
    onChange(next);
    persistUrls(next);
  }

  function removeAt(index: number) {
    const url = urls[index];
    const next = urls.filter((_, i) => i !== index);
    onChange(next);
    persistUrls(next);
    void deleteDraftImage(url).catch(err => console.error('[photo] delete failed:', err));
  }

  const canAddMore = urls.length + pendingCount < maxPhotos;
  const meetsMinimum = urls.length >= minPhotos;

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-2xl border-[1.5px] border-dashed p-5',
          'transition-colors duration-150',
          isDragging ? 'border-warm-amber bg-warm-amber/5' : 'border-ghost-border bg-pure-surface'
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-body font-medium text-charcoal-ink">
              {t('headline', { min: minPhotos, max: maxPhotos })}
            </p>
            <p className="text-body-small text-muted-steel">{t('help')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canAddMore}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-4" />
              <span>{t('add')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canAddMore}
              onClick={() => {
                if (!fileInputRef.current) return;
                fileInputRef.current.capture = 'environment';
                fileInputRef.current.click();
              }}
            >
              <Camera className="size-4" />
              <span>{t('camera')}</span>
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME.join(',')}
          multiple
          onChange={onFileChange}
          className="sr-only"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={urls} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {urls.map((url, i) => (
              <SortablePhotoTile
                key={url}
                url={url}
                index={i}
                isCover={i === 0}
                onRemove={() => removeAt(i)}
                coverLabel={t('cover')}
                removeLabel={t('remove')}
              />
            ))}

            {Array.from({ length: pendingCount }).map((_, i) => (
              <div
                key={`pending-${i}`}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <Skeleton rounded="lg" className="absolute inset-0" />
              </div>
            ))}

            {canAddMore && urls.length === 0 && pendingCount === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'aspect-square rounded-xl',
                  'flex flex-col items-center justify-center gap-1',
                  'border-[1.5px] border-dashed border-ghost-border bg-pure-surface',
                  'text-muted-steel',
                  'hover:border-warm-amber hover:text-warm-amber-700',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2'
                )}
              >
                <Plus className="size-5" />
                <span className="text-caption">{t('addFirst')}</span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between text-body-small">
        <span className="text-muted-steel" lang="en">
          {urls.length} / {maxPhotos}
        </span>
        {isSaving && <span className="text-muted-steel">{t('saving')}</span>}
        {!isSaving && meetsMinimum && (
          <span className="text-success-sage">{t('readyToContinue')}</span>
        )}
        {!isSaving && !meetsMinimum && urls.length > 0 && (
          <span className="text-warm-amber-700">
            {t('moreNeeded', { more: minPhotos - urls.length })}
          </span>
        )}
      </div>

      {error && <FormMessage tone="error">{tErr(error)}</FormMessage>}
    </div>
  );
}

interface TileProps {
  url: string;
  index: number;
  isCover: boolean;
  onRemove: () => void;
  coverLabel: string;
  removeLabel: string;
}

function SortablePhotoTile({ url, index, isCover, onRemove, coverLabel, removeLabel }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-xl',
        'bg-canvas-zinc border border-whisper-divider',
        isDragging && 'z-10 shadow-[0_10px_25px_-10px_rgba(24,24,27,0.2)]'
      )}
    >
      <Image
        src={url}
        alt={`photo-${index + 1}`}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover pointer-events-none select-none"
      />

      {isCover && (
        <span
          className="
            absolute top-2 start-2
            inline-flex items-center
            px-2 py-0.5 rounded-md
            bg-charcoal-ink/85 text-white
            text-caption font-semibold uppercase tracking-wide
          "
        >
          {coverLabel}
        </span>
      )}

      <button
        type="button"
        aria-label="reorder"
        className="
          absolute top-2 end-2
          inline-flex items-center justify-center size-7 rounded-md
          bg-pure-surface/90 text-charcoal-ink
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          cursor-grab active:cursor-grabbing
          focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2
        "
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="
          absolute bottom-2 end-2
          inline-flex items-center justify-center size-7 rounded-md
          bg-pure-surface/90 text-danger-coral
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          hover:bg-danger-coral hover:text-white
          focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-coral focus-visible:ring-offset-2
        "
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
