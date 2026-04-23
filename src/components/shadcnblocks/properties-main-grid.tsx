'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown } from 'lucide-react';
import type { PropertyCard } from '@/lib/properties/types';
import ListingCardProperties from './listing-card-properties';

/**
 * Properties hub — main grid with filter chips + sort.
 *
 * Client-side filtering/sorting of the pre-fetched grid (simple,
 * fast, no re-fetch round-trip for filter toggles). For larger
 * result sets Phase 4c+1 will add server-side pagination.
 *
 * Filter chips:
 *   All · For rent · For sale · Rooms · Land · Chalets ⭐
 *
 * Sort options (5):
 *   Most recent (default) · Price low → high · Price high → low ·
 *   Most bedrooms · Largest area
 *
 * Chalets filter is a doctrine differentiator (⭐) — highlights the
 * Dubizzle gap. Rooms chip is similarly our differentiator.
 */

type FilterKey = 'all' | 'rent' | 'sale' | 'rooms' | 'land' | 'chalet';

const FILTER_PREDICATES: Record<FilterKey, (c: PropertyCard) => boolean> = {
  all: () => true,
  rent: c =>
    c.subCat === 'property-for-rent' || c.subCat === 'rooms-for-rent',
  sale: c => c.subCat === 'property-for-sale' || c.subCat === 'land',
  rooms: c => c.subCat === 'rooms-for-rent',
  land: c => c.subCat === 'land',
  chalet: c => c.propertyType === 'chalet',
};

type SortKey = 'recent' | 'priceLow' | 'priceHigh' | 'beds' | 'area';

function sortCards(cards: PropertyCard[], sort: SortKey): PropertyCard[] {
  const copy = [...cards];
  switch (sort) {
    case 'priceLow':
      return copy.sort((a, b) => a.priceMinorUnits - b.priceMinorUnits);
    case 'priceHigh':
      return copy.sort((a, b) => b.priceMinorUnits - a.priceMinorUnits);
    case 'beds':
      return copy.sort((a, b) => (b.bedrooms ?? 0) - (a.bedrooms ?? 0));
    case 'area':
      return copy.sort((a, b) => (b.areaSqm ?? 0) - (a.areaSqm ?? 0));
    case 'recent':
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

interface Props {
  allCards: PropertyCard[];
  locale: 'ar' | 'en';
}

export default function PropertiesMainGrid({ allCards, locale: _locale }: Props) {
  const t = useTranslations('marketplace.properties.hub.grid');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('recent');

  const filtered = useMemo(() => allCards.filter(FILTER_PREDICATES[filter]), [
    allCards,
    filter,
  ]);
  const sorted = useMemo(() => sortCards(filtered, sort), [filtered, sort]);

  const chips: Array<{ key: FilterKey; labelKey: string }> = [
    { key: 'all', labelKey: 'filterAll' },
    { key: 'rent', labelKey: 'filterRent' },
    { key: 'sale', labelKey: 'filterSale' },
    { key: 'rooms', labelKey: 'filterRooms' },
    { key: 'land', labelKey: 'filterLand' },
    { key: 'chalet', labelKey: 'filterChalet' },
  ];

  return (
    <section id="all-properties" className="border-b border-border/40 bg-background py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-calSans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              {t('showingCount', { count: sorted.length, total: allCards.length })}
            </p>
          </div>

          {/* Sort */}
          <label className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs text-foreground/70">
            <ArrowUpDown size={12} />
            <span className="hidden sm:inline">{t('sortLabel')}:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="bg-transparent text-foreground outline-none"
            >
              <option value="recent">{t('sortRecent')}</option>
              <option value="priceLow">{t('sortPriceLow')}</option>
              <option value="priceHigh">{t('sortPriceHigh')}</option>
              <option value="beds">{t('sortBeds')}</option>
              <option value="area">{t('sortArea')}</option>
            </select>
          </label>
        </div>

        {/* Filter chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {chips.map(chip => {
            const isActive = filter === chip.key;
            const count = allCards.filter(FILTER_PREDICATES[chip.key]).length;
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                  (isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
                }
              >
                {t(chip.labelKey as any)}
                <span
                  className={
                    'rounded-full px-1.5 py-0.5 text-[10px] ' +
                    (isActive ? 'bg-white/20' : 'bg-foreground/10')
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 py-14 text-center">
            <p className="font-semibold text-foreground">{t('emptyTitle')}</p>
            <p className="text-sm text-foreground/60">{t('emptyBody')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map(card => (
              <ListingCardProperties key={card.id} card={card} locale={_locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
