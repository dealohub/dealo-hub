'use client';

import { motion } from 'framer-motion';
import {
  useRelativeTime,
  CAT_COLORS,
  CAT_LABEL,
  type ListingItem,
} from './live-feed-parts';

/**
 * ListingCardTimeline — Option E (timeline row, square thumb).
 *
 * Layout (RTL-logical, works in both LTR and RTL):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ [time]  [IMG]  [cat · loc · badge]                 [P]  │
 *   │  Now    80px    Title                              Pri  │
 *   │   •              👁 24 · ♥ 88 · 💬 6                 Cur │
 *   └──────────────────────────────────────────────────────────┘
 *
 * - Square thumbnail (80×80)
 * - Compact timestamp column on the start side with a pulse dot for the newest item
 * - Category-tinted chip + verification/hot/price-drop badges inline
 * - Price on the end side, red treatment when priceDrop
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

// Hex → rgba with alpha. Accepts '#rrggbb'.
const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

interface Props {
  item: ListingItem;
  priceDrop?: boolean;
}

export const ListingCardTimeline = ({ item, priceDrop = false }: Props) => {
  const rel = useRelativeTime(item.ts);
  const catColor = CAT_COLORS[item.cat] || 'currentColor';
  const catLabel = CAT_LABEL[item.cat] || '';
  const sig = hashSignals(item.id);
  const isFresh = rel === 'Just now';

  return (
    <motion.a
      href="#"
      layout
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className={
        'group relative flex items-stretch gap-3 rounded-2xl p-3 transition-all duration-300 hover:-translate-y-0.5 ' +
        (priceDrop
          ? 'bg-primary/[0.03] hover:bg-primary/[0.06]'
          : 'hover:bg-foreground/[0.03]')
      }
    >
      {/* Time column */}
      <div className="relative flex w-12 shrink-0 flex-col items-center pt-1">
        {isFresh ? (
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: catColor }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: catColor }}
            />
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-foreground/20" />
        )}
        <span
          className={
            'mt-1 font-mono text-[10px] font-semibold tabular-nums ' +
            (isFresh ? '' : 'text-foreground/50')
          }
          style={isFresh ? { color: catColor } : undefined}
        >
          {rel.replace('Just now', 'Now').replace(' ago', '')}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {item.featured && (
          <span className="absolute start-1 top-1 rounded bg-gradient-to-br from-amber-300 to-amber-600 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-[#1a1306] shadow">
            ◆
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        {/* Meta header row */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider"
            style={{
              background: withAlpha(catColor, 0.15),
              color: catColor,
            }}
          >
            {catLabel}
          </span>
          <span className="truncate text-foreground/50">{item.loc}</span>
          {priceDrop && (
            <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-[#ff6b6b]">
              ▼ Price drop
            </span>
          )}
          {!priceDrop && sig.hot && (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
              🔥 Hot
            </span>
          )}
          {item.verified && !priceDrop && !sig.hot && (
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="truncate text-[14px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-foreground/50">
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="tabular-nums font-medium text-foreground/75">{sig.watching}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
            </svg>
            <span className="tabular-nums font-medium text-foreground/75">{sig.saves}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="tabular-nums font-medium text-foreground/75">{sig.inquiries}</span>
          </span>
        </div>
      </div>

      {/* Price column */}
      <div className="relative flex shrink-0 flex-col items-end justify-center gap-0.5 ps-2">
        {priceDrop && item.oldPrice && (
          <span className="text-[10px] text-foreground/40 line-through tabular-nums">
            {item.oldPrice}
          </span>
        )}
        <span
          className={
            'text-lg font-bold tabular-nums leading-none ' +
            (priceDrop ? 'text-[#ff6b6b]' : 'text-foreground')
          }
        >
          {item.price}
        </span>
        {priceDrop && item.drop ? (
          <span className="text-[10px] font-semibold text-[#ff6b6b] tabular-nums">
            ▼ -{Math.abs(item.drop)}%
          </span>
        ) : (
          <span className="max-w-[110px] truncate text-[10px] text-foreground/45">
            {item.dealer}
          </span>
        )}
      </div>
    </motion.a>
  );
};

export default ListingCardTimeline;
