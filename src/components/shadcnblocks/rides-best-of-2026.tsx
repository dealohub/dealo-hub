'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * RidesBestOf2026 — editorial block showcasing the "Best Rides of 2026"
 * award. Left: award graphic + headline + CTAs. Right: 3 winning
 * vehicles in a refined row. Emulates the Cars.com "Best Cars of 2026"
 * editorial block but scaled for a richer marketplace.
 */

const WINNERS = [
  {
    key: 'suv',
    image:
      'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=800&auto=format&fit=crop',
  },
  {
    key: 'sedan',
    image:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop',
  },
  {
    key: 'ev',
    image:
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop',
  },
];

export const RidesBestOf2026 = () => {
  const t = useTranslations('marketplace.rides.best');

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.01] shadow-sm">
          <div className="grid gap-10 p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
            {/* Left: editorial */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
              className="flex flex-col justify-center"
            >
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A86A]">
                <Trophy size={12} strokeWidth={2.2} />
                {t('eyebrow')}
              </div>

              <h2 className="font-calSans text-[34px] font-extrabold leading-[1.05] tracking-tight text-foreground md:text-[44px]">
                {t('title')}
              </h2>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-foreground/60 md:text-[15px]">
                {t('description')}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-5 text-[13px] font-semibold text-background transition hover:bg-foreground/90"
                >
                  {t('ctaPrimary')}
                  <ArrowRight size={13} className="rtl:rotate-180" />
                </a>
                <a
                  href="#"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.03] px-5 text-[13px] font-semibold text-foreground/80 transition hover:border-foreground/30 hover:bg-foreground/[0.07] hover:text-foreground"
                >
                  {t('ctaSecondary')}
                </a>
              </div>

              {/* Category wins summary */}
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-foreground/10 pt-5">
                <StatBlock label={t('stat1Label')} value="6" />
                <StatBlock label={t('stat2Label')} value="100+" />
                <StatBlock label={t('stat3Label')} value="2026" />
              </div>
            </motion.div>

            {/* Right: 3 winners */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
              className="grid grid-cols-3 gap-3 md:gap-4"
            >
              {WINNERS.map((w, i) => (
                <div
                  key={w.key}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-foreground/[0.05]">
                    <img
                      src={w.image}
                      alt=""
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                      loading="lazy"
                    />
                    {/* Winner badge */}
                    <span className="absolute start-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-[#C9A86A] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1a1306] shadow-md">
                      #{i + 1}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                      {t(`winners.${w.key}Category`)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
                      {t(`winners.${w.key}Title`)}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="font-calSans text-[24px] font-extrabold leading-none tracking-tight text-foreground">
      {value}
    </div>
    <div className="mt-1 text-[10px] uppercase tracking-wider text-foreground/50">
      {label}
    </div>
  </div>
);

export default RidesBestOf2026;
