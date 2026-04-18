import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

interface SellerStatsBarProps {
  activeCount: number;
  soldCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  className?: string;
}

/**
 * SellerStatsBar — compact monospace summary row.
 *
 * Western digits only (numberingSystem: 'latn' via lang='en' on the numbers).
 * Star badge suppressed until ≥ 3 reviews per Section 14.
 */
export async function SellerStatsBar({
  activeCount,
  soldCount,
  ratingAvg,
  ratingCount,
  className,
}: SellerStatsBarProps) {
  const t = await getTranslations('profile.stats');
  const showRating = typeof ratingAvg === 'number' && ratingCount >= 3;

  return (
    <div
      className={cn(
        'flex items-center flex-wrap gap-x-4 gap-y-1',
        'font-mono text-body-small',
        className
      )}
    >
      <span className="flex items-baseline gap-1">
        <strong className="text-charcoal-ink tabular-nums" lang="en">
          {activeCount}
        </strong>
        <span className="text-muted-steel">{t('activeListings')}</span>
      </span>

      <span className="text-whisper-divider" aria-hidden="true">
        ·
      </span>

      <span className="flex items-baseline gap-1">
        <strong className="text-charcoal-ink tabular-nums" lang="en">
          {soldCount}
        </strong>
        <span className="text-muted-steel">{t('sold')}</span>
      </span>

      {showRating && (
        <>
          <span className="text-whisper-divider" aria-hidden="true">
            ·
          </span>
          <span className="flex items-center gap-1">
            <Star
              className="size-3.5 text-caution-flax"
              fill="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <strong className="text-charcoal-ink tabular-nums" lang="en">
              {ratingAvg.toFixed(1)}
            </strong>
            <span className="text-muted-steel tabular-nums" lang="en">
              ({ratingCount})
            </span>
          </span>
        </>
      )}
    </div>
  );
}
