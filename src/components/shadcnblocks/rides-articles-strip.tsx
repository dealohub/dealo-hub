'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Clock } from 'lucide-react';

/**
 * RidesArticlesStrip — "Latest from our experts" strip.
 * 4 editorial cards. Mixes guides + news + reviews.
 */

const ARTICLES = [
  {
    key: 'ev-guide',
    category: 'guide',
    minutes: 8,
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&auto=format&fit=crop',
  },
  {
    key: 'used-suv',
    category: 'buying',
    minutes: 6,
    image: 'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=600&auto=format&fit=crop',
  },
  {
    key: 'boat-first',
    category: 'review',
    minutes: 10,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&auto=format&fit=crop',
  },
  {
    key: 'prices',
    category: 'market',
    minutes: 5,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop',
  },
];

export const RidesArticlesStrip = () => {
  const t = useTranslations('marketplace.rides.articles');

  return (
    <section className="relative w-full border-t border-foreground/10 bg-foreground/[0.02]">
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              {t('eyebrow')}
            </p>
            <h2 className="mt-1 font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
              {t('title')}
            </h2>
          </div>
          <a
            href="#"
            className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-foreground/60 transition hover:text-foreground md:inline-flex"
          >
            {t('viewAll')}
            <ArrowRight size={12} className="rtl:rotate-180" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ARTICLES.map((a, i) => (
            <motion.a
              key={a.key}
              href="#"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 0.61, 0.36, 1] }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img
                  src={a.image}
                  alt=""
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />
                <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground/65 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-background backdrop-blur-md">
                  {t(`categories.${a.category}`)}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                  {t(`items.${a.key}.title`)}
                </h3>
                <p className="line-clamp-2 text-[12.5px] leading-relaxed text-foreground/55">
                  {t(`items.${a.key}.excerpt`)}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-foreground/5 pt-3 text-[11px] text-foreground/50">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} strokeWidth={2} />
                    {t('readTime', { minutes: a.minutes })}
                  </span>
                  <ArrowRight
                    size={13}
                    className="shrink-0 text-foreground/40 transition-colors duration-300 group-hover:text-foreground rtl:rotate-180"
                  />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RidesArticlesStrip;
