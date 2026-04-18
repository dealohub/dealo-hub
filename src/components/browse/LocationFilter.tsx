'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchAreasForCity } from '@/lib/listings/actions';
import type { Locale } from '@/i18n/routing';
import { useFilterState } from './filter-store';
import { FilterBlock } from './FilterBlock';

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

interface Area {
  id: number;
  name_ar: string;
  name_en: string;
}

interface LocationFilterProps {
  cities: City[];
}

export function LocationFilter({ cities }: LocationFilterProps) {
  const t = useTranslations('browse.filter.location');
  const locale = useLocale() as Locale;
  const { filters, patch } = useFilterState();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    if (!filters.cityId) {
      setAreas([]);
      return;
    }
    let cancelled = false;
    setLoadingAreas(true);
    fetchAreasForCity(filters.cityId).then(data => {
      if (!cancelled) {
        setAreas(data);
        setLoadingAreas(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filters.cityId]);

  const activeAreas = new Set(filters.areaIds ?? []);

  function toggleArea(id: number, checked: boolean) {
    const next = new Set(activeAreas);
    if (checked) next.add(id);
    else next.delete(id);
    patch({ areaIds: next.size > 0 ? Array.from(next) : undefined });
  }

  return (
    <FilterBlock labelKey="browse.filter.location.title">
      <Select
        value={filters.cityId ? String(filters.cityId) : 'all'}
        onValueChange={value => {
          patch({
            cityId: value === 'all' ? undefined : Number(value),
            areaIds: undefined,
          });
        }}
      >
        <SelectTrigger className="h-10">
          <SelectValue placeholder={t('allKuwait')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allKuwait')}</SelectItem>
          {cities.map(city => (
            <SelectItem key={city.id} value={String(city.id)}>
              {locale === 'ar' ? city.name_ar : city.name_en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.cityId && areas.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto mt-1 ps-1">
          {areas.map(area => (
            <label key={area.id} className="flex items-center gap-2 cursor-pointer text-body-small">
              <Checkbox
                checked={activeAreas.has(area.id)}
                onCheckedChange={checked => toggleArea(area.id, !!checked)}
              />
              <span>{locale === 'ar' ? area.name_ar : area.name_en}</span>
            </label>
          ))}
        </div>
      )}

      {loadingAreas && (
        <span className="text-caption text-muted-steel">{t('loadingAreas')}</span>
      )}
    </FilterBlock>
  );
}
