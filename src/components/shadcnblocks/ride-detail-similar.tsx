'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  VEHICLE_COLORS,
  RIDE_LISTINGS,
  type RideListing,
} from './rides-data';

/**
 * RideDetailSimilar — curated "you may also like" carousel.
 *
 * Deliberately neutral: no price verdicts, no judgments, no
 * side-by-side comparison that might disadvantage either the current
 * listing or the recommended ones. Just a helpful way for the buyer
 * to keep exploring inside Dealo.
 *
 * Sorting logic: same vehicle type, then closest price — so a shopper
 * looking at a 500k SUV sees 400k–600k SUVs next, not random picks.
 */

interface Props {
  listing: RideListing;
}

const parsePriceAmount = (raw: string): number => {
  const m = raw.match(/([\d,\.]+)/);
  return m ? Number(m[1].replace(/,/g, '')) : 0;
};

const parsePriceParts = (raw: string) => {
  const m = raw.match(/^([A-Z]+)\s*([\d,\.]+)/);
  return {
    currency: m?.[1] ?? 'AED',
    amount: m ? Number(m[2].replace(/,/g, '')) : 0,
  };
};

export const RideDetailSimilar = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.similar');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const catColor = VEHICLE_COLORS[listing.type];

  const similar = useMemo(() => {
    const currentPrice = parsePriceAmount(listing.price);
    const others = RIDE_LISTINGS.filter(
      (l) => l.id !== listing.id && l.type === listing.type,
    );
    const withDistance = others.map((l) => ({
      l,
      diff: Math.abs(parsePriceAmount(l.price) - currentPrice),
    }));
    withDistance.sort((a, b) => a.diff - b.diff);
    return withDistance.slice(0, 4).map((x) => x.l);
  }, [listing.id, listing.type, listing.price]);

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
          href={`/${locale}/rides?type=${listing.type}`}
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
          const sp = parsePriceParts(s.price);
          const sColor = VEHICLE_COLORS[s.type];
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
                href={`/${locale}/rides/${s.id}`}
                className="group block overflow-hidden rounded-2xl border border-foreground/10 bg-background transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/5"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-foreground/[0.04]">
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 240px, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  {/* Gradient for legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Year chip */}
                  <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    <Calendar size={9} strokeWidth={2.6} />
                    <span className="tabular-nums">{s.year}</span>
                  </span>

                  {/* Featured / hot dot */}
                  {(s.featured || s.hot) && (
                    <span
                      className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider backdrop-blur"
                      style={{ color: sColor }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: sColor }}
                      />
                      {s.featured ? t('featured') : t('hot')}
                    </span>
                  )}

                  {/* Photo count */}
                  <span className="absolute bottom-2.5 end-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
                    {s.photoCount} {t('photos')}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5">
                  <p className="truncate text-[13.5px] font-semibold text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-foreground/55">
                    <MapPin size={10} strokeWidth={2.2} className="shrink-0" />
                    <span className="truncate">{s.location}</span>
                  </p>
                  <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-foreground/[0.06] pt-2.5">
                    <span className="font-calSans text-[15px] font-bold tabular-nums text-foreground">
                      <span className="text-[10px] font-semibold text-foreground/55">
                        {sp.currency}{' '}
                      </span>
                      {sp.amount.toLocaleString('en-US')}
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
