'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { PriceModeEnum, type PriceMode } from '@/lib/listings/validators';
import { useFilterState } from './filter-store';
import { FilterBlock } from './FilterBlock';

const KEY_MAP: Record<PriceMode, string> = {
  fixed: 'fixed',
  negotiable: 'negotiable',
  best_offer: 'bestOffer',
};

export function PriceModeFilter() {
  const t = useTranslations('listing.priceMode');
  const { filters, patch } = useFilterState();
  const active = new Set(filters.priceModes ?? []);

  function toggle(value: PriceMode, checked: boolean) {
    const next = new Set(active);
    if (checked) next.add(value);
    else next.delete(value);
    patch({ priceModes: next.size > 0 ? Array.from(next) : undefined });
  }

  return (
    <FilterBlock labelKey="browse.filter.priceMode">
      <div className="flex flex-col gap-2">
        {PriceModeEnum.options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer select-none text-body">
            <Checkbox
              checked={active.has(opt)}
              onCheckedChange={checked => toggle(opt, !!checked)}
            />
            <span>{t(KEY_MAP[opt])}</span>
          </label>
        ))}
      </div>
    </FilterBlock>
  );
}
