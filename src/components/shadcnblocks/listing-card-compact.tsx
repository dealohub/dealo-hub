'use client';

import { motion } from 'framer-motion';
import {
  useRelativeTime,
  CAT_COLORS,
  CAT_LABEL,
  type ListingItem,
} from './live-feed-parts';

/**
 * ListingCardCompact — Option B (dense list row).
 *
 * Horizontal strip: small 4:3 image · category + location · title ·
 * chips · signals · price · dealer · actions.
 * Meant to render in a vertical list with minimal gap so 8–10 rows
 * are visible without scrolling.
 */

const hashSignals = (id: string | number) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const watching = 3 + (h % 52);
  const saves = 8 + ((h >>> 3) % 240);
  const inquiries = 1 + ((h >>> 7) % 28);
  const hot = watching >= 20 || inquiries >= 15;
  return { watching, saves, inquiries, hot };
};

interface Props {
  item: ListingItem;
  priceDrop?: boolean;
}

export const ListingCardCompact = ({ item, priceDrop = false }: Props) => {
  const rel = useRelativeTime(item.ts);
  const catColor = CAT_COLORS[item.cat] || 'currentColor';
  const catLabel = CAT_LABEL[item.cat] || '';
  const sig = hashSignals(item.id);

  const chips = (item.meta || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (
    <motion.article
      layout
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className={
        'group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ' +
        (priceDrop
          ? 'border-[#e30613]/25 bg-[#e30613]/[0.04] hover:border-[#e30613]/40'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]')
      }
    >
      {/* Category accent rail */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px] rounded-l-lg"
        style={{ background: priceDrop ? '#e30613' : catColor, opacity: priceDrop ? 0.7 : 0.4 }}
      />

      {/* Image — small 4:3 */}
      <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-foreground/5">
        <img
          src={item.image}
          alt={item.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          loading="lazy"
        />
        {/* Just-now pulse dot, only when fresh */}
        {rel === 'Just now' && (
          <span className="absolute left-1.5 top-1.5 inline-flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: catColor }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: catColor }}
            />
          </span>
        )}
        {priceDrop && (
          <span className="absolute bottom-1 left-1 rounded-sm bg-[#e30613] px-1 py-px text-[9px] font-bold uppercase tracking-wider text-white">
            {Math.abs(item.drop ?? 0)}%
          </span>
        )}
      </div>

      {/* Middle — title + meta line */}
      <div className="min-w-0 flex-1">
        {/* Tiny header: CATEGORY · location · timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-foreground/50">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground/70">
            <span
              className="inline-block size-1 rounded-full"
              style={{ background: catColor }}
            />
            {catLabel}
          </span>
          <span className="text-foreground/25">·</span>
          <span className="truncate normal-case tracking-normal">{item.loc}</span>
          <span className="text-foreground/25">·</span>
          <span className="font-mono tabular-nums normal-case tracking-normal text-foreground/45">
            {rel}
          </span>
          {item.featured && !priceDrop && (
            <span className="inline-flex items-center rounded bg-[#C9A86A]/10 px-1 text-[9px] font-bold text-[#E8C98D]">
              FEATURED
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-0.5 truncate text-[14px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        {/* Chips + signals in one wrapping row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {chips.map((c, i) => (
            <span key={`c-${i}`} className="text-foreground/55">
              {c}
            </span>
          ))}
          {chips.length > 0 && <span className="text-foreground/20">·</span>}

          <span className="inline-flex items-center gap-1 text-foreground/55">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="tabular-nums font-medium text-foreground/75">{sig.watching}</span>
            <span className="text-foreground/40">watching</span>
          </span>

          <span className="inline-flex items-center gap-1 text-foreground/55">
            <span className="tabular-nums font-medium text-foreground/75">{sig.saves}</span>
            <span className="text-foreground/40">saves</span>
          </span>

          <span className="inline-flex items-center gap-1 text-foreground/55">
            <span className="tabular-nums font-medium text-foreground/75">{sig.inquiries}</span>
            <span className="text-foreground/40">inquiries</span>
          </span>

          {sig.hot && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/25 bg-amber-400/5 px-1.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
              </svg>
              Hot
            </span>
          )}
        </div>
      </div>

      {/* Right — price + dealer + actions */}
      <div className="flex shrink-0 items-center gap-3 ps-3">
        <div className="text-end">
          {priceDrop && item.oldPrice && (
            <div className="text-[10px] text-foreground/35 line-through tabular-nums">
              {item.oldPrice}
            </div>
          )}
          <div className="text-[16px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {item.price}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-foreground/55">
            <span className="max-w-[120px] truncate">{item.dealer}</span>
            {item.verified && (
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
            )}
          </div>
        </div>

        <div className="hidden items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
          <IconActionButton label="Save">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </IconActionButton>
          <IconActionButton label="Compare">
            <path d="M3 6h18M3 12h18M3 18h12" />
          </IconActionButton>
          <IconActionButton label="View">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </IconActionButton>
        </div>
      </div>
    </motion.article>
  );
};

const IconActionButton = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    aria-label={label}
    className="flex size-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.02] text-foreground/50 transition hover:border-foreground/20 hover:bg-foreground/[0.06] hover:text-foreground"
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  </button>
);

export default ListingCardCompact;
