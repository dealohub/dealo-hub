'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';

/**
 * CategoryPicker — Step 1 of /sell.
 *
 * Two-level selection:
 *   1. Top-level category tile (e.g., Automotive, Real Estate)
 *   2. Sub-category chip (e.g., used-cars, property-for-rent)
 *
 * On Continue: saves draft { category_id, subcategory_id, current_step:
 * 'media' } and routes to /sell/media.
 *
 * Categories passed from the server component — this is purely
 * presentational + handles the save action.
 */

export interface CategoryNode {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  children: Array<{ id: number; slug: string; name: string }>;
}

interface Props {
  locale: 'ar' | 'en';
  categories: CategoryNode[];
  initialCategoryId: number | null;
  initialSubcategoryId: number | null;
}

export default function CategoryPicker({
  locale,
  categories,
  initialCategoryId,
  initialSubcategoryId,
}: Props) {
  const t = useTranslations('sell.step.category');
  const tNav = useTranslations('sell.nav');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCatId, setSelectedCatId] = useState<number | null>(initialCategoryId);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(initialSubcategoryId);
  const [error, setError] = useState<string | null>(null);

  const selectedCat = categories.find(c => c.id === selectedCatId) ?? null;
  const canContinue = selectedCatId != null;

  async function handleContinue() {
    if (!canContinue) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDraft({
        category_id: selectedCatId,
        subcategory_id: selectedSubId,
        current_step: 'media',
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/sell/media`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Top-level grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map(cat => {
          const isActive = cat.id === selectedCatId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCatId(cat.id);
                setSelectedSubId(null);
              }}
              className={
                'group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition ' +
                (isActive
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
              }
            >
              <span className="text-xl" aria-hidden="true">
                {iconFor(cat.slug)}
              </span>
              <span className="text-sm font-semibold text-foreground">{cat.name}</span>
              {isActive && (
                <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-categories */}
      {selectedCat && selectedCat.children.length > 0 && (
        <div className="space-y-2.5 rounded-xl bg-foreground/[0.02] p-4">
          <p className="text-xs font-medium text-foreground/70">
            {t('subtitleChoose', { category: selectedCat.name })}
            <span className="ms-1 text-foreground/40">· {t('subOptional')}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedCat.children.map(sub => {
              const isActive = sub.id === selectedSubId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubId(isActive ? null : sub.id)}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                    (isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground/70 ring-1 ring-border/60 hover:bg-foreground/5')
                  }
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isPending}
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

/**
 * Small emoji lookup for top-level cats. Fallback = 📦. Replace with
 * proper lucide icons once the taxonomy is fully defined.
 */
function iconFor(slug: string): string {
  const map: Record<string, string> = {
    automotive: '🚗',
    'real-estate': '🏢',
    electronics: '📱',
    'home-furniture': '🛋️',
    luxury: '👜',
    'baby-kids': '👶',
    'games-hobbies': '🎮',
    'sports-outdoor': '⚽',
    'home-fitness': '🏋️',
    'home-appliances': '🍳',
    beauty: '💄',
    general: '📦',
  };
  return map[slug] ?? '📦';
}
