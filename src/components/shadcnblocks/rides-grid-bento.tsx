'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ListingCardRides } from './listing-card-rides';
import { RIDE_LISTINGS, type RideListing, type VehicleType } from './rides-data';

/**
 * RidesGridBento — experimental Bento layout for the /rides page.
 *
 * Pattern: a 4-column CSS grid where some cards span 2 cols and/or 2 rows
 * ("spotlight" or "wide"). The rhythm breaks up a uniform list and
 * highlights premium/featured items.
 *
 * TRADE-OFF NOTE: Bento is great for editorial / marketing but can hurt
 * comparative-shopping UX because cards with different sizes are hard
 * to price-compare visually. This component exists so we can A/B it
 * against a uniform-grid alternative and judge on real screens.
 */

interface Props {
  filterType: VehicleType | 'all';
}

// How many items to show initially; "Load more" adds 8 each click.
const INITIAL_COUNT = 12;
const PAGE = 8;

export const RidesGridBento = ({ filterType }: Props) => {
  const t = useTranslations('marketplace.rides');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const filtered = useMemo(() => {
    if (filterType === 'all') return RIDE_LISTINGS;
    return RIDE_LISTINGS.filter((it) => it.type === filterType);
  }, [filterType]);

  const visible = filtered.slice(0, visibleCount);

  if (visible.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="relative">
      {/*
        Bento grid — 4 cols on lg, 2 on md, 1 on sm.
        Individual cards opt into span via ListingCardRides `size`.
        `grid-auto-flow: dense` lets small cards fill gaps left by
        spotlights so we never get ragged holes.
      */}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 md:auto-rows-[minmax(0,auto)] lg:grid-cols-4"
        style={{ gridAutoFlow: 'dense' }}
      >
        <AnimatePresence initial={false}>
          {visible.map((item: RideListing) => (
            <ListingCardRides key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>

      {/* Load-more footer */}
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

      {/* Total count footer */}
      <p className="mt-4 text-center text-[11px] text-foreground/40">
        {t('resultsCount', { shown: visible.length, total: filtered.length })}
      </p>
    </div>
  );
};

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
        <h3 className="text-base font-semibold text-foreground">
          {t('title')}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-foreground/55">
          {t('subtitle')}
        </p>
      </div>
    </div>
  );
};

export default RidesGridBento;
