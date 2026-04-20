'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

/**
 * RidesDealerSpotlight — "Top verified dealers" showcase row.
 * Four dealer partner cards with logo, specialty, stats, CTA.
 * Complements the landing-page Featured Partners section but scopes
 * to vehicle dealers specifically.
 */

const DEALERS = [
  { key: 'alFuttaim', logo: 'AF', tint: '#ef4444', listings: '1,248', years: '24 yrs', rating: '4.9' },
  { key: 'gargash',   logo: 'GM', tint: '#111827', listings: '446',   years: '61 yrs', rating: '4.9' },
  { key: 'alTayer',   logo: 'AT', tint: '#047857', listings: '892',   years: '38 yrs', rating: '4.8' },
  { key: 'audiDubai', logo: 'AU', tint: '#be123c', listings: '310',   years: '18 yrs', rating: '4.8' },
];

export const RidesDealerSpotlight = () => {
  const t = useTranslations('marketplace.rides.dealers');

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
            <span className="h-px w-6 bg-foreground/20" />
            {t('eyebrow')}
            <span className="h-px w-6 bg-foreground/20" />
          </p>
          <h2 className="font-calSans text-[28px] font-semibold tracking-tight text-foreground md:text-[34px]">
            {t('title')}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-foreground/55">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEALERS.map((d) => (
            <article
              key={d.key}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-foreground/5"
            >
              <span
                aria-hidden
                className="absolute start-0 top-0 h-full w-[2px] opacity-50"
                style={{ background: d.tint }}
              />

              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold tracking-tight"
                  style={{ background: `${d.tint}18`, color: d.tint }}
                >
                  {d.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {t(`items.${d.key}.name`)}
                    </p>
                    <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
                      <path d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z" fill="#3B82F6" />
                      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-foreground/45">
                    {t(`items.${d.key}.specialty`)}
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <p className="mt-3 line-clamp-2 min-h-[2.2em] text-[12px] leading-relaxed text-foreground/55">
                {t(`items.${d.key}.tagline`)}
              </p>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-3 border-t border-foreground/10 pt-3 text-[10px]">
                <div>
                  <div className="font-semibold tabular-nums text-foreground/90">{d.listings}</div>
                  <div className="text-foreground/40">{t('stats.listings')}</div>
                </div>
                <div className="h-7 w-px bg-foreground/10" />
                <div>
                  <div className="font-semibold tabular-nums text-foreground/90">{d.years}</div>
                  <div className="text-foreground/40">{t('stats.active')}</div>
                </div>
                <div className="h-7 w-px bg-foreground/10" />
                <div>
                  <div className="inline-flex items-center gap-0.5 font-semibold tabular-nums text-foreground/90">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {d.rating}
                  </div>
                  <div className="text-foreground/40">{t('stats.rating')}</div>
                </div>
              </div>

              {/* CTA */}
              <a
                href="#"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.02] py-2 text-[11.5px] font-semibold text-foreground/80 transition hover:border-foreground/30 hover:bg-foreground/[0.06] hover:text-foreground"
              >
                {t('viewInventory')}
                <ArrowRight size={11} className="rtl:rotate-180" />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
          >
            {t('browseAll')}
            <ArrowRight size={12} className="rtl:rotate-180" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default RidesDealerSpotlight;
