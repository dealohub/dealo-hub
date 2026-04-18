'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { DeliveryOptionEnum, type DeliveryOption } from '@/lib/listings/validators';
import { useFilterState } from './filter-store';
import { FilterBlock } from './FilterBlock';

const KEY_MAP: Record<DeliveryOption, string> = {
  pickup: 'pickup',
  seller_delivers: 'sellerDelivers',
  buyer_ships: 'buyerShips',
};

export function DeliveryFilter() {
  const t = useTranslations('listing.deliveryOptions');
  const { filters, patch } = useFilterState();
  const active = new Set(filters.deliveryOptions ?? []);

  function toggle(value: DeliveryOption, checked: boolean) {
    const next = new Set(active);
    if (checked) next.add(value);
    else next.delete(value);
    patch({ deliveryOptions: next.size > 0 ? Array.from(next) : undefined });
  }

  return (
    <FilterBlock labelKey="browse.filter.delivery">
      <div className="flex flex-col gap-2">
        {DeliveryOptionEnum.options.map(opt => (
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
