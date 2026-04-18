'use client';

import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDismiss,
  BottomSheetBody,
  BottomSheetFooter,
  BottomSheetClose,
} from '@/components/ui/bottom-sheet';
import { PriceRangeSlider } from './PriceRangeSlider';
import { ConditionFilter } from './ConditionFilter';
import { LocationFilter } from './LocationFilter';
import { PriceModeFilter } from './PriceModeFilter';
import { DeliveryFilter } from './DeliveryFilter';
import { TrustFilter } from './TrustFilter';
import { countActiveFilters } from '@/lib/browse/filters';
import { useFilterState } from './filter-store';

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

interface FilterBottomSheetProps {
  cities: City[];
  priceMinMinor?: number;
  priceMaxMinor?: number;
}

export function FilterBottomSheet({
  cities,
  priceMinMinor,
  priceMaxMinor,
}: FilterBottomSheetProps) {
  const t = useTranslations('browse.filter');
  const { filters, reset } = useFilterState();
  const count = countActiveFilters(filters);

  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2 lg:hidden">
          <SlidersHorizontal className="size-4" />
          <span>{t('button')}</span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-warm-amber text-white text-caption font-semibold tabular-nums">
              {count}
            </span>
          )}
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent title={t('title')} hideTitle>
        <BottomSheetHeader>
          <BottomSheetTitle>{t('title')}</BottomSheetTitle>
          <BottomSheetDismiss label={t('close')} />
        </BottomSheetHeader>
        <BottomSheetBody>
          <div className="flex flex-col gap-6">
            <PriceRangeSlider
              defaultMinMinor={priceMinMinor}
              defaultMaxMinor={priceMaxMinor}
            />
            <ConditionFilter />
            <LocationFilter cities={cities} />
            <PriceModeFilter />
            <DeliveryFilter />
            <TrustFilter />
          </div>
        </BottomSheetBody>
        <BottomSheetFooter>
          <Button variant="ghost" size="sm" onClick={reset}>
            {t('clearAll')}
          </Button>
          <BottomSheetClose asChild>
            <Button size="sm">{t('apply')}</Button>
          </BottomSheetClose>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
