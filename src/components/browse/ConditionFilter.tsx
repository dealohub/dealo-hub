'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { ConditionEnum, type Condition } from '@/lib/listings/validators';
import { useFilterState } from './filter-store';
import { FilterBlock } from './FilterBlock';

const KEY_MAP: Record<Condition, string> = {
  new: 'new',
  new_with_tags: 'newWithTags',
  like_new: 'likeNew',
  excellent_used: 'excellentUsed',
  good_used: 'goodUsed',
  fair_used: 'fairUsed',
};

export function ConditionFilter() {
  const t = useTranslations('listing.condition');
  const { filters, patch } = useFilterState();
  const active = new Set(filters.conditions ?? []);

  function toggle(value: Condition, checked: boolean) {
    const next = new Set(active);
    if (checked) next.add(value);
    else next.delete(value);
    patch({ conditions: next.size > 0 ? Array.from(next) : undefined });
  }

  return (
    <FilterBlock labelKey="browse.filter.condition">
      <div className="flex flex-col gap-2">
        {ConditionEnum.options.map(opt => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer select-none text-body"
          >
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
