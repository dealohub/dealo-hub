'use client';

import { motion } from 'framer-motion';
import { Heart, GitCompare, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { formatPriceNumber } from '@/lib/format';
import type { RideCard } from '@/lib/rides/types';

/**
 * ListingCardRides — uniform image-forward card for the /rides grid.
 *
 * Consumes the shallow `RideCard` shape produced by the hub queries.
 * Per Phase 3c §3.4, fields that don't live on RideCard (featured,
 * hot, drop%, oldPrice, dealer, photoCount, live-watching pulse) are
 * omitted rather than synthesised. Future phases may promote any of
 * them onto RideCard if the data justifies the extra payload.
 *
 * `premium` is a visual-only flag set by the featured row component.
 */

interface Props {
  item: RideCard;
  premium?: boolean;
}

export const ListingCardRides = ({ item, premium = false }: Props) => {
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('marketplace.feed.card');
  const catColor = item.catColor;

  const mileageLabel =
    item.mileageKm == null
      ? null
      : item.mileageKm === 0
        ? '0 km'
        : `${item.mileageKm.toLocaleString('en-US')} km`;

  return (
    <motion.article
      initial={{ y: 12, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={
        'group relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ' +
        (premium
          ? 'border-[#C9A86A]/35 bg-[#C9A86A]/[0.03] hover:border-[#C9A86A]/60 hover:shadow-[#C9A86A]/10'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04] hover:shadow-foreground/5')
      }
    >
      {/* Full-card click target — sits under interactive elements */}
      <Link
        href={`/rides/${item.slug}` as never}
        aria-label={item.title}
        className="absolute inset-0 z-0"
      />

      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden
            className="size-full"
            style={{ background: `linear-gradient(135deg, ${catColor}1a, ${catColor}05)` }}
          />
        )}

        {/* Subtle top + bottom gradients for chip legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Top-end: quick actions — z-20 to stay clickable above the card link */}
        <div className="absolute end-3 top-3 z-20 flex items-center gap-1.5">
          <IconButton label={t('actionSave')}>
            <Heart size={14} strokeWidth={2} />
          </IconButton>
          <IconButton label={t('actionCompare')}>
            <GitCompare size={14} strokeWidth={2} />
          </IconButton>
        </div>

        {/* Bottom-start: year + body style chips */}
        <div className="absolute bottom-3 start-3 flex items-center gap-2">
          {item.year != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-md">
              <Calendar size={10} strokeWidth={2.4} />
              {item.year}
            </span>
          )}
          {item.bodyStyle && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: catColor }}
              />
              {item.bodyStyle}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold tabular-nums text-foreground/55">
            {item.currencyCode}
          </span>
          <div className="text-[20px] font-semibold tabular-nums tracking-tight text-foreground">
            {formatPriceNumber(item.priceMinorUnits, item.currencyCode, locale)}
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        {/* Spec line: mileage · fuel */}
        {(mileageLabel || item.fuelType) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/55">
            {mileageLabel && <span>{mileageLabel}</span>}
            {mileageLabel && item.fuelType && (
              <span className="text-foreground/25">·</span>
            )}
            {item.fuelType && <span className="capitalize">{item.fuelType}</span>}
          </div>
        )}

        {/* Location */}
        {item.cityName && (
          <div className="inline-flex items-center gap-1 text-[12px] text-foreground/55">
            <MapPin size={11} strokeWidth={2.2} className="shrink-0" />
            <span className="truncate">{item.cityName}</span>
          </div>
        )}

        {/* Footer — arrow only (shallow card) */}
        <div className="mt-auto flex items-center justify-end border-t border-foreground/10 pt-3">
          <ArrowRight
            size={14}
            strokeWidth={2.2}
            className="shrink-0 text-foreground/40 transition-colors duration-300 group-hover:text-foreground rtl:rotate-180"
          />
        </div>
      </div>
    </motion.article>
  );
};

const IconButton = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    aria-label={label}
    className="grid size-8 place-items-center rounded-full bg-black/55 text-white/85 backdrop-blur-md transition hover:bg-black/75 hover:text-white"
  >
    {children}
  </button>
);

export default ListingCardRides;
