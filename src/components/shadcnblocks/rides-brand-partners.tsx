'use client';

import { useTranslations } from 'next-intl';

/**
 * RidesBrandPartners — horizontal logo strip of OEM / dealer partners.
 * Each logo is a linkable brand page. Greyscale by default, color on
 * hover, matched to simpleicons for consistency.
 */

const BRANDS = [
  { name: 'Toyota',      url: 'https://cdn.simpleicons.org/toyota' },
  { name: 'BMW',         url: 'https://cdn.simpleicons.org/bmw' },
  { name: 'Mercedes',    url: 'https://cdn.simpleicons.org/mercedes' },
  { name: 'Audi',        url: 'https://cdn.simpleicons.org/audi' },
  { name: 'Porsche',     url: 'https://cdn.simpleicons.org/porsche' },
  { name: 'Land Rover',  url: 'https://cdn.simpleicons.org/landrover' },
  { name: 'Lexus',       url: 'https://cdn.simpleicons.org/lexus' },
  { name: 'Ferrari',     url: 'https://cdn.simpleicons.org/ferrari' },
  { name: 'Ducati',      url: 'https://cdn.simpleicons.org/ducati' },
  { name: 'Tesla',       url: 'https://cdn.simpleicons.org/tesla' },
  { name: 'Volkswagen',  url: 'https://cdn.simpleicons.org/volkswagen' },
  { name: 'Nissan',      url: 'https://cdn.simpleicons.org/nissan' },
];

export const RidesBrandPartners = () => {
  const t = useTranslations('marketplace.rides.brands');
  return (
    <section className="relative w-full border-y border-foreground/10 bg-foreground/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-foreground/25" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
              {t('eyebrow')}
            </p>
          </div>
          <a
            href="#"
            className="hidden items-center gap-1.5 text-[12px] font-medium text-foreground/55 transition hover:text-foreground md:inline-flex"
          >
            {t('browseAll')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Logo grid */}
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
          {BRANDS.map((b) => (
            <a
              key={b.name}
              href="#"
              title={b.name}
              className="group flex h-10 items-center justify-center opacity-45 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              <img
                src={b.url}
                alt={b.name}
                className="h-8 w-auto max-w-[88px] object-contain invert dark:invert-0"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.innerHTML = `<span class='text-[11px] font-semibold text-foreground/60'>${b.name}</span>`;
                  }
                }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RidesBrandPartners;
