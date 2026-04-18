'use client';

import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { Condition, DeliveryOption, PriceMode } from '@/lib/listings/validators';
import { countActiveFilters } from '@/lib/browse/filters';
import { useFilterState } from './filter-store';

interface FilterChipsBarProps {
  className?: string;
}

const CONDITION_KEYS: Record<Condition, string> = {
  new: 'new',
  new_with_tags: 'newWithTags',
  like_new: 'likeNew',
  excellent_used: 'excellentUsed',
  good_used: 'goodUsed',
  fair_used: 'fairUsed',
};

const PRICE_MODE_KEYS: Record<PriceMode, string> = {
  fixed: 'fixed',
  negotiable: 'negotiable',
  best_offer: 'bestOffer',
};

const DELIVERY_KEYS: Record<DeliveryOption, string> = {
  pickup: 'pickup',
  seller_delivers: 'sellerDelivers',
  buyer_ships: 'buyerShips',
};

interface Chip {
  id: string;
  label: string;
  onRemove: () => void;
}

function Chip({ chip }: { chip: Chip }) {
  return (
    <button
      type="button"
      onClick={chip.onRemove}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 ps-3 pe-2 rounded-full',
        'bg-warm-amber/10 border border-warm-amber/20 text-warm-amber-700 text-body-small font-medium',
        'hover:bg-warm-amber/15 transition-colors'
      )}
    >
      <span>{chip.label}</span>
      <X className="size-3.5" strokeWidth={2.25} />
    </button>
  );
}

export function FilterChipsBar({ className }: FilterChipsBarProps) {
  const tCondition = useTranslations('listing.condition');
  const tMode = useTranslations('listing.priceMode');
  const tDelivery = useTranslations('listing.deliveryOptions');
  const tChips = useTranslations('browse.chips');
  const locale = useLocale() as Locale;
  const { filters, patch } = useFilterState();

  if (countActiveFilters(filters) === 0) return null;

  const chips: Chip[] = [];

  if (filters.priceMin != null || filters.priceMax != null) {
    const min = filters.priceMin ?? 0;
    const max = filters.priceMax;
    const label = max
      ? `${formatPrice(min, 'KWD', locale)} — ${formatPrice(max, 'KWD', locale)}`
      : `${tChips('from')} ${formatPrice(min, 'KWD', locale)}`;
    chips.push({
      id: 'price',
      label,
      onRemove: () => patch({ priceMin: undefined, priceMax: undefined }),
    });
  }

  filters.conditions?.forEach(c =>
    chips.push({
      id: `c-${c}`,
      label: tCondition(CONDITION_KEYS[c]),
      onRemove: () =>
        patch({
          conditions:
            filters.conditions!.filter(x => x !== c).length > 0
              ? filters.conditions!.filter(x => x !== c)
              : undefined,
        }),
    })
  );

  filters.priceModes?.forEach(m =>
    chips.push({
      id: `m-${m}`,
      label: tMode(PRICE_MODE_KEYS[m]),
      onRemove: () =>
        patch({
          priceModes:
            filters.priceModes!.filter(x => x !== m).length > 0
              ? filters.priceModes!.filter(x => x !== m)
              : undefined,
        }),
    })
  );

  filters.deliveryOptions?.forEach(d =>
    chips.push({
      id: `d-${d}`,
      label: tDelivery(DELIVERY_KEYS[d]),
      onRemove: () =>
        patch({
          deliveryOptions:
            filters.deliveryOptions!.filter(x => x !== d).length > 0
              ? filters.deliveryOptions!.filter(x => x !== d)
              : undefined,
        }),
    })
  );

  if (filters.sellerPhoneVerified) {
    chips.push({
      id: 'verified',
      label: tChips('phoneVerified'),
      onRemove: () => patch({ sellerPhoneVerified: undefined }),
    });
  }
  if (filters.hasVideo) {
    chips.push({
      id: 'video',
      label: tChips('hasVideo'),
      onRemove: () => patch({ hasVideo: undefined }),
    });
  }
  if (filters.hasDocumentation) {
    chips.push({
      id: 'docs',
      label: tChips('hasDocumentation'),
      onRemove: () => patch({ hasDocumentation: undefined }),
    });
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {chips.map(chip => (
        <Chip key={chip.id} chip={chip} />
      ))}
    </div>
  );
}
