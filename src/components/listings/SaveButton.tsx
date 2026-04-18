'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/format';
import { toggleFavorite } from '@/lib/favorites/actions';
import type { Locale } from '@/i18n/routing';

interface SaveButtonProps {
  listingId: number;
  initialSaved: boolean;
  count: number;
  locale: Locale;
  /** When true, renders larger + label visible (used on listing detail page). */
  expanded?: boolean;
  className?: string;
}

interface OptimisticState {
  isSaved: boolean;
  count: number;
}

/**
 * SaveButton — heart toggle with optimistic UI (DESIGN.md Section 8).
 *
 * - Optimistic flip on click, reverts if the server action fails
 * - Anon users: redirected to /signin with a return hint
 * - Count hidden at zero to keep cards visually quiet
 */
export function SaveButton({
  listingId,
  initialSaved,
  count,
  locale,
  expanded,
  className,
}: SaveButtonProps) {
  const t = useTranslations('listing.card');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [state, applyOptimistic] = useOptimistic<OptimisticState, boolean>(
    { isSaved: initialSaved, count },
    (prev, nextSaved) => ({
      isSaved: nextSaved,
      count: prev.count + (nextSaved ? 1 : -1),
    })
  );

  function handleClick() {
    const nextSaved = !state.isSaved;
    startTransition(async () => {
      applyOptimistic(nextSaved);
      const result = await toggleFavorite(listingId);
      if (!result.ok) {
        if (result.error === 'unauthenticated') {
          router.push(`/${locale}/signin`);
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={state.isSaved}
      aria-label={state.isSaved ? t('unsave') : t('save')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        'text-muted-steel hover:text-charcoal-ink',
        'transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2 focus-visible:ring-offset-pure-surface',
        expanded ? 'h-10 px-3 border border-ghost-border bg-pure-surface' : 'size-8 justify-center',
        className
      )}
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          expanded ? 'size-4' : 'size-4',
          state.isSaved
            ? 'fill-warm-amber text-warm-amber scale-110'
            : 'fill-none'
        )}
        strokeWidth={state.isSaved ? 0 : 1.75}
      />
      {state.count > 0 && (
        <span className="text-caption tabular-nums font-medium">
          {formatCount(state.count, locale)}
        </span>
      )}
      {expanded && (
        <span className="text-body-small font-medium">
          {state.isSaved ? t('saved') : t('save')}
        </span>
      )}
    </button>
  );
}
