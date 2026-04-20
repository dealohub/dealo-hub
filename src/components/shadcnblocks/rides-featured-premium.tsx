'use client';

import { useTranslations } from 'next-intl';
import { ListingCardRides } from './listing-card-rides';
import { RIDE_LISTINGS } from './rides-data';

/**
 * RidesFeaturedPremium — 4 paid-placement listings in a dedicated row,
 * clearly labeled "Featured" with gold accents. Separate from the main
 * grid so ranking integrity stays intact.
 */

export const RidesFeaturedPremium = () => {
  const t = useTranslations('marketplace.rides.featured');
  // Pick the first 4 featured listings from seed data
  const picks = RIDE_LISTINGS.filter((l) => l.featured).slice(0, 4);

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A86A]">
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
          {picks.map((p) => (
            <ListingCardRides key={p.id} item={p} premium />
          ))}
        </div>

        <p className="mt-4 text-center text-[10.5px] text-foreground/40">
          {t('disclosure')}
        </p>
      </div>
    </section>
  );
};

export default RidesFeaturedPremium;
