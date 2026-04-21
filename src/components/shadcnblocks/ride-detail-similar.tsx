'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatPriceNumber } from '@/lib/format';
import type { RideCard } from '@/lib/rides/types';

/**
 * RideDetailSimilar — curated "you may also like" carousel.
 *
 * Receives pre-fetched RideCard[] from the server (getSimilarRides)
 * — no local filtering. The parent listing's catColor + category slug
 * are passed for the eyebrow accent and the "view all" link.
 */

interface Props {
  similar: RideCard[];
  catColor: string;
  /** Sub-category slug (e.g. 'used-cars') used for the "view all" filter. */
  categorySlug: string;
}

export const RideDetailSimilar = ({
  similar,
  catColor,
  categorySlug,
}: Props) => {
  const t = useTranslations('marketplace.rides.detail.similar');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  if (similar.length === 0) return null;

  return (
    <section className="relative">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
            <span className="h-px w-6" style={{ background: catColor }} />
            {t('eyebrow')}
          </div>
          <h2 className="font-calSans text-[22px] font-extrabold tracking-tight text-foreground md:text-[26px]">
            {t('title')}
          </h2>
        </div>
        <Link
          href={`/${locale}/rides?cat=${categorySlug}`}
          className="group inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground/70 transition hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowIcon
            size={13}
            strokeWidth={2.4}
            className="transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
          />
        </Link>
      </div>

      {/* Grid / carousel */}
      <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-3 [scrollbar-width:thin] md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
        {similar.map((s, i) => {
          const locale2 = (isAr ? 'ar' : 'en') as 'ar' | 'en';
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="min-w-[220px] flex-shrink-0 snap-start md:min-w-0"
            >
              <Link
                href={`/${locale}/rides/${s.slug}`}
                className="group block overflow-hidden rounded-2xl border border-foreground/10 bg-background transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/5"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-foreground/[0.04]">
                  {s.coverImage && (
                    <Image
                      src={s.coverImage}
                      alt={s.title}
                      fill
                      sizes="(max-width: 768px) 240px, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  )}
                  {/* Gradient for legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Year chip */}
                  {s.year != null && (
                    <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      <Calendar size={9} strokeWidth={2.6} />
                      <span className="tabular-nums">{s.year}</span>
                    </span>
                  )}

                  {/* Sub-category tint dot */}
                  <span
                    className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider backdrop-blur"
                    style={{ color: s.catColor }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: s.catColor }}
                    />
                    {s.bodyStyle ?? ''}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5">
                  <p className="truncate text-[13.5px] font-semibold text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-foreground/55">
                    <MapPin size={10} strokeWidth={2.2} className="shrink-0" />
                    <span className="truncate">{s.cityName}</span>
                  </p>
                  <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-foreground/[0.06] pt-2.5">
                    <span className="font-calSans text-[15px] font-bold tabular-nums text-foreground">
                      <span className="text-[10px] font-semibold text-foreground/55">
                        {s.currencyCode}{' '}
                      </span>
                      {formatPriceNumber(
                        s.priceMinorUnits,
                        s.currencyCode,
                        locale2,
                      )}
                    </span>
                    <span className="inline-flex size-6 items-center justify-center rounded-full border border-foreground/10 text-foreground/40 transition group-hover:border-foreground/30 group-hover:text-foreground">
                      <ArrowIcon size={11} strokeWidth={2.6} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default RideDetailSimilar;
