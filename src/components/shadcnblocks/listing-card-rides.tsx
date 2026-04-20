'use client';

import { motion } from 'framer-motion';
import { Heart, GitCompare, ArrowRight, Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VEHICLE_COLORS, type BentoSize, type RideListing } from './rides-data';

/**
 * ListingCardRides — image-forward card for the /rides Bento grid.
 * Supports three size variants that span different grid cells:
 *   standard   → 1×1 (image 16:9)
 *   wide       → 2×1 (image 16:9 but wider, shows more meta)
 *   spotlight  → 2×2 (image 4:3 hero, extra badges, bigger price)
 */

interface Props {
  item: RideListing;
  size?: BentoSize;
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

export const ListingCardRides = ({ item, size = 'standard' }: Props) => {
  const finalSize = item.bentoSize ?? size;
  const catColor = VEHICLE_COLORS[item.type];
  const sig = hashSignals(item.id);
  const t = useTranslations('marketplace.feed.card');

  // Span classes that opt each variant into its grid slot
  const spanClass =
    finalSize === 'spotlight'
      ? 'md:col-span-2 md:row-span-2'
      : finalSize === 'wide'
        ? 'md:col-span-2'
        : '';

  // Different aspect for spotlight vs standard/wide
  const aspectClass =
    finalSize === 'spotlight' ? 'aspect-[4/3]' : 'aspect-[16/10]';

  return (
    <motion.article
      initial={{ y: 12, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={
        'group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] shadow-sm transition-all duration-300 hover:border-foreground/20 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-foreground/5 ' +
        spanClass
      }
    >
      {/* IMAGE */}
      <div className={'relative w-full overflow-hidden ' + aspectClass}>
        <img
          src={item.image}
          alt={item.title}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          loading="lazy"
        />

        {/* Top gradient fade for badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />

        {/* Top-start: trust + state badges */}
        <div className="absolute start-3 top-3 flex items-center gap-1.5">
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
          {item.featured && !item.dropPct && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/40 bg-[#C9A86A]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#E8C98D] backdrop-blur-md">
              ◆ {t('featured')}
            </span>
          )}
          {item.dropPct !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e30613] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#e30613]/30">
              {item.dropPct}%
            </span>
          )}
        </div>

        {/* Top-end: actions */}
        <div className="absolute end-3 top-3 flex items-center gap-1.5">
          <IconButton label={t('actionSave')}>
            <Heart size={14} strokeWidth={2} />
          </IconButton>
          <IconButton label={t('actionCompare')}>
            <GitCompare size={14} strokeWidth={2} />
          </IconButton>
        </div>

        {/* Bottom-start: photo count + vehicle-type accent */}
        <div className="absolute bottom-3 start-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            <Camera size={10} strokeWidth={2.2} />
            {item.photoCount}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md"
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: catColor }}
            />
            {item.type}
          </span>
        </div>
      </div>

      {/* Vertical accent rail */}
      <span
        aria-hidden
        className="absolute start-0 top-0 h-full w-[2px] opacity-40"
        style={{ background: catColor }}
      />

      {/* CONTENT */}
      <div
        className={
          'flex flex-1 flex-col gap-2 p-4 ' +
          (finalSize === 'spotlight' ? 'md:p-6 md:gap-3' : '')
        }
      >
        {/* Price + drop strike */}
        <div className="flex items-baseline gap-2">
          {item.oldPrice && (
            <span className="text-[11px] text-foreground/35 line-through tabular-nums">
              {item.oldPrice}
            </span>
          )}
          <div
            className={
              'font-semibold tabular-nums tracking-tight text-foreground ' +
              (finalSize === 'spotlight' ? 'text-[28px] md:text-[32px]' : 'text-[20px]')
            }
          >
            {item.price}
          </div>
        </div>

        {/* Title */}
        <h3
          className={
            'font-semibold leading-snug tracking-tight text-foreground ' +
            (finalSize === 'spotlight' ? 'text-[18px] md:text-[20px]' : 'text-[15px]') +
            ' line-clamp-2'
          }
        >
          {item.title}
        </h3>

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/55">
          <span className="font-medium tabular-nums">{item.year}</span>
          <span className="text-foreground/25">·</span>
          <span>{item.specA}</span>
          <span className="text-foreground/25">·</span>
          <span>{item.specB}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/55">
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
