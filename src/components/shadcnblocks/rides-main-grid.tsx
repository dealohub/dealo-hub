'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListingCardRides } from './listing-card-rides';
import {
  RIDE_LISTINGS,
  VEHICLE_TYPES,
  VEHICLE_COLORS,
  type VehicleType,
} from './rides-data';

/**
 * RidesMainGrid — the main browse grid.
 *
 * Uniform 4-col grid (Baymard: uniform > bento for comparative shopping).
 * Sort controls + sub-type chips + active filter display above.
 * Load-more pagination (not infinite scroll).
 */

type SortKey = 'relevance' | 'priceAsc' | 'priceDesc' | 'newest' | 'popular';

const INITIAL = 12;
const PAGE = 8;

export const RidesMainGrid = () => {
  const t = useTranslations('marketplace.rides.main');
  const tTypes = useTranslations('marketplace.rides.types');

  const [activeType, setActiveType] = useState<VehicleType | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('relevance');
  const [visibleCount, setVisibleCount] = useState(INITIAL);

  const filtered = useMemo(() => {
    // 1. filter by sub-type
    let items =
      activeType === 'all'
        ? RIDE_LISTINGS.filter((l) => !l.featured) // exclude the paid ones shown in featured row
        : RIDE_LISTINGS.filter((l) => l.type === activeType);

    // 2. sort
    const num = (p: string) => Number(p.replace(/[^0-9]/g, ''));
    switch (sortKey) {
      case 'priceAsc':
        items = [...items].sort((a, b) => num(a.price) - num(b.price));
        break;
      case 'priceDesc':
        items = [...items].sort((a, b) => num(b.price) - num(a.price));
        break;
      case 'newest':
        items = [...items].sort((a, b) => b.year - a.year);
        break;
      case 'popular':
        items = [...items].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0));
        break;
    }
    return items;
  }, [activeType, sortKey]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
              {t('title')}
            </h2>
            <p className="mt-1 text-[13px] text-foreground/55">
              {t('count', { total: filtered.length })}
            </p>
          </div>

          {/* Sort + view toggle */}
          <div className="flex items-center gap-2">
            <SortSelect value={sortKey} onChange={setSortKey} />
            <div className="hidden items-center gap-1 rounded-full border border-foreground/10 bg-foreground/[0.03] p-1 md:flex">
              <ViewToggleButton active>
                <LayoutGrid size={13} />
              </ViewToggleButton>
              <ViewToggleButton>
                <List size={13} />
              </ViewToggleButton>
            </div>
          </div>
        </div>

        {/* Sub-type chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip active={activeType === 'all'} onClick={() => setActiveType('all')}>
            {t('sortAllTypes')}
          </Chip>
          {VEHICLE_TYPES.map(({ key, emoji }) => (
            <Chip
              key={key}
              active={activeType === key}
              onClick={() => setActiveType(key)}
              accent={VEHICLE_COLORS[key]}
            >
              <span>{emoji}</span>
              <span>{tTypes(key)}</span>
            </Chip>
          ))}
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence initial={false}>
                {visible.map((item) => (
                  <ListingCardRides key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>

            {/* Load more */}
            {visibleCount < filtered.length && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-5 py-2.5 text-[12px] font-semibold text-foreground/80 transition hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
                >
                  {t('loadMore')}
                  <span className="text-foreground/40 tabular-nums">
                    ({filtered.length - visibleCount})
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const SortSelect = ({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) => {
  const t = useTranslations('marketplace.rides.main.sort');
  const options: { key: SortKey; label: string }[] = [
    { key: 'relevance', label: t('relevance') },
    { key: 'priceAsc', label: t('priceAsc') },
    { key: 'priceDesc', label: t('priceDesc') },
    { key: 'newest', label: t('newest') },
    { key: 'popular', label: t('popular') },
  ];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-9 appearance-none rounded-full border border-foreground/10 bg-foreground/[0.03] pe-8 ps-3 text-[12px] font-medium text-foreground/80 outline-none transition hover:border-foreground/25 hover:bg-foreground/[0.06]"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {t('prefix')}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-foreground/45"
      />
    </div>
  );
};

const ViewToggleButton = ({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) => (
  <button
    type="button"
    className={
      'grid size-7 place-items-center rounded-full transition ' +
      (active
        ? 'bg-foreground text-background'
        : 'text-foreground/50 hover:bg-foreground/[0.06] hover:text-foreground')
    }
  >
    {children}
  </button>
);

const Chip = ({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition ' +
      (active
        ? 'border-foreground/40 bg-foreground text-background'
        : 'border-foreground/10 bg-foreground/[0.03] text-foreground/75 hover:border-foreground/25 hover:bg-foreground/[0.06]')
    }
    style={active && accent ? { borderColor: accent, background: accent, color: 'white' } : undefined}
  >
    {children}
  </button>
);

const EmptyState = () => {
  const t = useTranslations('marketplace.rides.empty');
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-6 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-foreground/[0.05] text-foreground/50">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
        <p className="mt-1 max-w-sm text-sm text-foreground/55">{t('subtitle')}</p>
      </div>
    </div>
  );
};

export default RidesMainGrid;
