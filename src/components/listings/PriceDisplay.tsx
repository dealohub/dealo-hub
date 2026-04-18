import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { PriceMode } from '@/lib/listings/validators';
import { PriceModeBadge } from '@/components/sell/PriceModeBadge';

interface PriceDisplayProps {
  minorUnits: bigint | number;
  currency: string;
  priceMode: PriceMode;
  minOfferMinor?: bigint | number | null;
  locale: Locale;
  /** Controls typography scale. `card` matches ListingCard (Heading 3); `detail` bumps up for listing pages. */
  size?: 'card' | 'detail';
  className?: string;
}

/**
 * PriceDisplay — price + mode badge (DESIGN.md Section 8).
 *
 * Never renders struck-through "original prices" or discount percentages
 * — Dealo Hub is not a deals aggregator.
 */
export function PriceDisplay({
  minorUnits,
  currency,
  priceMode,
  minOfferMinor,
  locale,
  size = 'card',
  className,
}: PriceDisplayProps) {
  const t = useTranslations('listing.card');
  const priceText = formatPrice(minorUnits, currency, locale);
  const minOfferText =
    priceMode === 'best_offer' && minOfferMinor != null
      ? formatPrice(minOfferMinor, currency, locale)
      : null;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'font-mono tabular-nums font-bold text-charcoal-ink',
            size === 'card' ? 'text-heading-3' : 'text-heading-2'
          )}
        >
          {priceText}
        </span>
        <PriceModeBadge mode={priceMode} />
      </div>
      {minOfferText && (
        <span className="text-caption text-muted-steel">
          {t('minOffer', { price: minOfferText })}
        </span>
      )}
    </div>
  );
}
