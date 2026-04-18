'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Slider } from '@/components/ui/slider';
import { formatPrice, fromMinorUnits, toMinorUnits } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import { useFilterState } from './filter-store';
import { FilterBlock } from './FilterBlock';

interface PriceRangeSliderProps {
  /** Category-aware min/max (minor units). Falls back to sensible defaults. */
  defaultMinMinor?: number;
  defaultMaxMinor?: number;
  currency?: string;
}

const KWD_MIN_DEFAULT = 0; // 0.000 KWD
const KWD_MAX_DEFAULT = 500_000; // 500.000 KWD

export function PriceRangeSlider({
  defaultMinMinor = KWD_MIN_DEFAULT,
  defaultMaxMinor = KWD_MAX_DEFAULT,
  currency = 'KWD',
}: PriceRangeSliderProps) {
  const t = useTranslations('browse.filter');
  const locale = useLocale() as Locale;
  const { filters, patch } = useFilterState();

  const initialLo = filters.priceMin ?? defaultMinMinor;
  const initialHi = filters.priceMax ?? defaultMaxMinor;
  const [range, setRange] = useState<[number, number]>([initialLo, initialHi]);

  useEffect(() => {
    setRange([filters.priceMin ?? defaultMinMinor, filters.priceMax ?? defaultMaxMinor]);
  }, [filters.priceMin, filters.priceMax, defaultMinMinor, defaultMaxMinor]);

  // Convert minor <-> major for the slider UI to give a sensible step size.
  const sliderMin = fromMinorUnits(defaultMinMinor, currency);
  const sliderMax = fromMinorUnits(defaultMaxMinor, currency);
  const sliderLo = fromMinorUnits(range[0], currency);
  const sliderHi = fromMinorUnits(range[1], currency);

  function handleCommit(next: number[]) {
    const [lo, hi] = next;
    const loMinor = Number(toMinorUnits(lo, currency));
    const hiMinor = Number(toMinorUnits(hi, currency));
    patch({
      priceMin: loMinor > defaultMinMinor ? loMinor : undefined,
      priceMax: hiMinor < defaultMaxMinor ? hiMinor : undefined,
    });
  }

  return (
    <FilterBlock labelKey="browse.filter.priceRange">
      <div className="flex items-center justify-between text-body-small text-charcoal-ink font-medium">
        <span>{formatPrice(range[0], currency, locale)}</span>
        <span aria-hidden="true">—</span>
        <span>{formatPrice(range[1], currency, locale)}</span>
      </div>
      <Slider
        min={sliderMin}
        max={sliderMax}
        step={Math.max(1, Math.round((sliderMax - sliderMin) / 200))}
        value={[sliderLo, sliderHi]}
        onValueChange={([lo, hi]) => {
          setRange([
            Number(toMinorUnits(lo, currency)),
            Number(toMinorUnits(hi, currency)),
          ]);
        }}
        onValueCommit={handleCommit}
        aria-label={t('priceRange')}
        minStepsBetweenThumbs={1}
      />
    </FilterBlock>
  );
}
