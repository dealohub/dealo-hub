'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import * as Icons from 'lucide-react';
import type { ParentCategory } from '@/lib/listings/queries';
import { saveDraft } from '@/lib/listings/actions';
import { saveLocalDraft } from '@/lib/listings/draft';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface CategoryPickerProps {
  categories: ParentCategory[];
  initialCategoryId?: number | null;
  initialSubcategoryId?: number | null;
}

/**
 * Step 1 — pick a parent category, then a sub-category.
 *
 * UX:
 *   - Parent grid: 2 cols mobile, 4 cols ≥md. Visual cards with icon + count.
 *   - After parent selected, sub-category chips slide in below.
 *   - Each selection writes to localStorage immediately, debounces to DB via
 *     the server action, then navigates to `/sell/media`.
 */
export function CategoryPicker({
  categories,
  initialCategoryId = null,
  initialSubcategoryId = null,
}: CategoryPickerProps) {
  const locale = useLocale();
  const t = useTranslations('sell.step.category');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [parentId, setParentId] = useState<number | null>(initialCategoryId);
  const [subId, setSubId] = useState<number | null>(initialSubcategoryId);

  const selectedParent = categories.find(c => c.id === parentId) ?? null;

  function selectParent(id: number) {
    setParentId(id);
    setSubId(null);
    // Optimistic local save; server sync happens on Continue.
    saveLocalDraft({ category_id: id, subcategory_id: null, current_step: 'category' });
  }

  function selectSub(id: number) {
    setSubId(id);
    saveLocalDraft({ category_id: parentId ?? undefined, subcategory_id: id, current_step: 'category' });
  }

  function continueNext() {
    if (!parentId) return;
    startTransition(async () => {
      await saveDraft({
        category_id: parentId,
        subcategory_id: subId ?? null,
        current_step: 'media',
      });
      router.push('/sell/media');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Parent grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map(cat => (
          <ParentCard
            key={cat.id}
            cat={cat}
            locale={locale}
            selected={parentId === cat.id}
            onSelect={() => selectParent(cat.id)}
          />
        ))}
      </div>

      {/* Sub-category list */}
      {selectedParent && selectedParent.sub_categories.length > 0 && (
        <div
          className="
            flex flex-col gap-3 p-5 rounded-2xl
            bg-pure-surface border border-whisper-divider
            animate-fade-in-up
          "
        >
          <p className="text-body-small font-medium text-charcoal-ink">
            {t('subtitleChoose', {
              category: locale === 'ar' ? selectedParent.name_ar : selectedParent.name_en,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedParent.sub_categories.map(sub => (
              <SubChip
                key={sub.id}
                label={locale === 'ar' ? sub.name_ar : sub.name_en}
                selected={subId === sub.id}
                onClick={() => selectSub(sub.id)}
              />
            ))}
          </div>
          <p className="text-caption text-muted-steel">{t('subOptional')}</p>
        </div>
      )}

      {/* Continue CTA — pinned at bottom of content column (StepNavigation at page root
          is used for back-nav; inline CTA makes continuation feel immediate). */}
      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!parentId || isPending}
          onClick={continueNext}
        >
          <span>{isPending ? t('saving') : t('continue')}</span>
          <Icons.ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

interface ParentCardProps {
  cat: ParentCategory;
  locale: string;
  selected: boolean;
  onSelect: () => void;
}

function ParentCard({ cat, locale, selected, onSelect }: ParentCardProps) {
  const Icon = resolveIcon(cat.icon);
  const name = locale === 'ar' ? cat.name_ar : cat.name_en;
  const subCount = cat.sub_categories.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative',
        'flex flex-col items-start gap-2',
        'aspect-[4/5] p-4 sm:p-5 rounded-2xl text-start',
        'bg-pure-surface border-[1.5px] border-ghost-border',
        'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:-translate-y-0.5 hover:border-warm-amber/50 hover:shadow-[0_6px_20px_-8px_rgba(24,24,27,0.12)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
        selected &&
          'border-warm-amber ring-2 ring-warm-amber/30 bg-warm-amber/5 shadow-[0_6px_20px_-8px_rgba(217,119,6,0.3)]'
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center size-10 rounded-xl',
          'bg-canvas-zinc text-warm-amber-700 transition-colors',
          'group-hover:bg-warm-amber/10',
          selected && 'bg-warm-amber text-white'
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>

      {cat.tier === 'p0' && (
        <span
          className="
            absolute top-3 end-3
            inline-flex items-center justify-center
            size-5 rounded-full
            bg-warm-amber/10 text-warm-amber-700
            text-[10px] font-bold
          "
          aria-label="Priority"
        >
          ★
        </span>
      )}

      <span className="mt-auto flex flex-col gap-0.5 min-w-0 w-full">
        <span className="text-body font-semibold text-charcoal-ink line-clamp-2">
          {name}
        </span>
        <span className="text-caption text-muted-steel" lang="en">
          {subCount}+ sub
        </span>
      </span>
    </button>
  );
}

function SubChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center',
        'h-9 px-3 rounded-full',
        'text-body-small font-medium',
        'border-[1.5px] transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
        selected
          ? 'bg-warm-amber text-white border-warm-amber'
          : 'bg-pure-surface text-charcoal-ink border-ghost-border hover:border-warm-amber/50'
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Lucide icon resolver — categories table stores a string name; look it up on the client.
// ---------------------------------------------------------------------------

function resolveIcon(name: string | null): typeof Icons.Package {
  if (!name) return Icons.Package;
  const candidate = (Icons as unknown as Record<string, typeof Icons.Package | undefined>)[name];
  return candidate ?? Icons.Package;
}
