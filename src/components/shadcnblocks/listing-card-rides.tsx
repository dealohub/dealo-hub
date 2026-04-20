'use client';

import { motion } from 'framer-motion';
import { Heart, GitCompare, ArrowRight, Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { VEHICLE_COLORS, type RideListing } from './rides-data';

/**
 * ListingCardRides — uniform image-forward card for the /rides grid.
 * One size only; premium / featured / sponsored variants live in
 * separate components (rides-featured-premium, etc.) so their visual
 * weight is explicit and paid placements can't sneak past users.
 */

interface Props {
  item: RideListing;
  premium?: boolean;
}

const hashSignals = (id: number) => {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return {
    watching: 3 + (h % 52),
    saves: 8 + ((h >>> 3) % 240),
  };
};

export const ListingCardRides = ({ item, premium = false }: Props) => {
  const catColor = VEHICLE_COLORS[item.type];
  const sig = hashSignals(item.id);
  const t = useTranslations('marketplace.feed.card');

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
        href={`/rides/${item.id}` as never}
        aria-label={item.title}
        className="absolute inset-0 z-0"
      />

      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          loading="lazy"
        />
        {/* Subtle top + bottom gradients for chip legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Top-start: state badges */}
        <div className="absolute start-3 top-3 flex flex-wrap items-center gap-1.5">
          {item.verifiedListing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0">
                <path
                  d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z"
                  fill="#3B82F6"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Verified
            </span>
          )}
          {item.hot && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200 backdrop-blur-md">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
              </svg>
              {t('hot')}
            </span>
          )}
          {item.dropPct !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e30613] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#e30613]/30">
              {item.dropPct}%
            </span>
          )}
        </div>

        {/* Top-end: quick actions — z-20 to stay clickable above the card link */}
        <div className="absolute end-3 top-3 z-20 flex items-center gap-1.5">
          <IconButton label={t('actionSave')}>
            <Heart size={14} strokeWidth={2} />
          </IconButton>
          <IconButton label={t('actionCompare')}>
            <GitCompare size={14} strokeWidth={2} />
          </IconButton>
        </div>

        {/* Bottom-start: photo count + type tag */}
        <div className="absolute bottom-3 start-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            <Camera size={10} strokeWidth={2.2} />
            {item.photoCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            <span className="inline-block size-1.5 rounded-full" style={{ background: catColor }} />
            {item.type}
          </span>
        </div>
      </div>

      {/* Category accent rail */}
      <span
        aria-hidden
        className="absolute start-0 top-0 h-full w-[2px] opacity-40"
        style={{ background: premium ? '#C9A86A' : catColor }}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Price + strike */}
        <div className="flex items-baseline gap-2">
          {item.oldPrice && (
            <span className="text-[11px] text-foreground/35 line-through tabular-nums">
              {item.oldPrice}
            </span>
          )}
          <div className="text-[20px] font-semibold tabular-nums tracking-tight text-foreground">
            {item.price}
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        {/* Spec line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/55">
          <span className="font-medium tabular-nums">{item.year}</span>
          <span className="text-foreground/25">·</span>
          <span>{item.specA}</span>
          <span className="text-foreground/25">·</span>
          <span>{item.specB}</span>
        </div>

        {/* Location line */}
        <div className="text-[12px] text-foreground/55">
          <span className="truncate">{item.location}</span>
        </div>

        {/* Footer: dealer + live signal + arrow */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-foreground/10 pt-3">
          <div className="inline-flex min-w-0 items-center gap-1.5 text-[11.5px] text-foreground/65">
            <span className="truncate">{item.dealer}</span>
            {item.dealerVerified && (
              <svg width="11" height="11" viewBox="0 0 24 24" className="shrink-0">
                <path
                  d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z"
                  fill="#3B82F6"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-foreground/50">
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="tabular-nums font-medium text-foreground/75">{sig.watching}</span>
            </span>
            <ArrowRight
              size={14}
              strokeWidth={2.2}
              className="shrink-0 text-foreground/40 transition-colors duration-300 group-hover:text-foreground rtl:rotate-180"
            />
          </div>
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
