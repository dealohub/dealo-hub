'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PriceRangeSlider } from './PriceRangeSlider';
import { ConditionFilter } from './ConditionFilter';
import { LocationFilter } from './LocationFilter';
import { PriceModeFilter } from './PriceModeFilter';
import { DeliveryFilter } from './DeliveryFilter';
import { TrustFilter } from './TrustFilter';
import { useFilterState } from './filter-store';

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

interface FilterPanelProps {
  cities: City[];
  /** Category-aware min/max. Falls back to component defaults. */
  priceMinMinor?: number;
  priceMaxMinor?: number;
}

/**
 * Desktop sidebar filter stack. Mobile uses `<FilterBottomSheet />` with the
 * same children.
 */
export function FilterPanel({ cities, priceMinMinor, priceMaxMinor }: FilterPanelProps) {
  const t = useTranslations('browse.filter');
  const { reset } = useFilterState();

  return (
    <aside className="sticky top-20 flex flex-col gap-6 h-fit">
      <PriceRangeSlider defaultMinMinor={priceMinMinor} defaultMaxMinor={priceMaxMinor} />
      <ConditionFilter />
      <LocationFilter cities={cities} />
      <PriceModeFilter />
      <DeliveryFilter />
      <TrustFilter />
      <Button variant="ghost" size="sm" onClick={reset} className="justify-start">
        {t('clearAll')}
      </Button>
    </aside>
  );
}
