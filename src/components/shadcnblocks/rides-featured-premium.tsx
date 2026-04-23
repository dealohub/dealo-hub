'use client';

import { useTranslations } from 'next-intl';
import { ListingCardRides } from './listing-card-rides';
import type { RideCard } from '@/lib/rides/types';

/**
 * RidesFeaturedPremium — 4 paid-placement listings in a dedicated row,
 * clearly labeled "Featured" with gold accents. Separate from the main
 * grid so ranking integrity stays intact.
 *
 * Data is pre-fetched by the page via `getFeaturedRides` and passed in.
 * Component renders nothing when the list is empty.
 */

interface Props {
  items: RideCard[];
}

export const RidesFeaturedPremium = ({ items }: Props) => {
  const t = useTranslations('marketplace.rides.featured');

  if (items.length === 0) return null;

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#F59E0B]/60 bg-[#F59E0B]/18 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F59E0B]">
              ◆ {t('eyebrow')}
            </div>
            <h2 className="font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
              {t('title')}
            </h2>
            <p className="mt-1.5 max-w-lg text-[13px] text-foreground/55">
              {t('subtitle')}
            </p>
          </div>
          <a
            href="#"
            className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-foreground/60 transition hover:text-foreground md:inline-flex"
          >
            {t('viewAll')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* 4-col uniform grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <ListingCardRides key={p.id} item={p} premium />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RidesFeaturedPremium;
