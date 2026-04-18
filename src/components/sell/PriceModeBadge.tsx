import { Lock, MessageCircle, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { PriceMode } from '@/lib/listings/validators';

/**
 * PriceModeBadge — reusable pill showing the listing's price mode.
 * Mounted on ListingCard + ListingDetail in Sprint 4; used now on the wizard
 * preview step.
 */

const MODE_ICON: Record<PriceMode, typeof Lock> = {
  fixed: Lock,
  negotiable: MessageCircle,
  best_offer: Target,
};

const MODE_CLASS: Record<PriceMode, string> = {
  fixed: 'bg-zinc-100 text-zinc-700',
  negotiable: 'bg-warm-amber/10 text-warm-amber-700',
  best_offer: 'bg-success-sage/10 text-success-sage',
};

interface PriceModeBadgeProps {
  mode: PriceMode;
  className?: string;
  size?: 'sm' | 'md';
}

export function PriceModeBadge({ mode, className, size = 'sm' }: PriceModeBadgeProps) {
  const t = useTranslations('sell.priceMode');
  const Icon = MODE_ICON[mode];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-label uppercase tracking-wide' : 'px-2.5 h-7 text-body-small',
        MODE_CLASS[mode],
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2.25} aria-hidden="true" />
      <span>{t(`${mode}.label`)}</span>
    </span>
  );
}
