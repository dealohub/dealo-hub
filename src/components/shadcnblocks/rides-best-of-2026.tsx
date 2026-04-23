'use client';

import { useState } from 'react';
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
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop',
  },
  {
    key: 'boat',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&auto=format&fit=crop',
  },
  {
    key: 'bike',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop',
  },
];

export const RidesBestOf2026 = () => {
  const t = useTranslations('marketplace.rides.best');

  return (
    <section className="relative w-full border-t border-foreground/8 bg-foreground/[0.015]">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-6">
        <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/6 to-foreground/[0.02] shadow-sm">
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
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-5 text-[13px] font-semibold text-background transition-colors duration-150 hover:bg-foreground/90 active:scale-[0.98]"
                >
                  {t('ctaPrimary')}
                  <ArrowRight size={13} className="rtl:rotate-180" />
                </a>
                <a
                  href="#"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/3 px-5 text-[13px] font-semibold text-foreground/80 transition-colors duration-150 hover:border-foreground/30 hover:bg-foreground/7 hover:text-foreground active:scale-[0.98]"
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
                <WinnerCard key={w.key} w={w} index={i} t={t} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

type TranslationFn = ReturnType<typeof useTranslations>;

const WinnerCard = ({
  w,
  index,
  t,
}: {
  w: (typeof WINNERS)[0];
  index: number;
  t: TranslationFn;
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image with skeleton pulse until loaded */}
      <div
        className={`relative aspect-square w-full overflow-hidden bg-foreground/8 transition-colors duration-500 ${
          loaded ? '' : 'animate-pulse'
        }`}
      >
        <img
          src={w.image}
          alt=""
          className={`size-full object-cover transition-all duration-700 group-hover:scale-[1.08] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          onLoad={() => setLoaded(true)}
        />
        {/* Winner badge — always visible above skeleton */}
        <span className="absolute start-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-[#C9A86A] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1a1306] shadow-md">
          #{index + 1}
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
