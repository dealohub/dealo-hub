'use client';

import { motion } from 'framer-motion';
import {
  useRelativeTime,
  CAT_COLORS,
  CAT_LABEL,
  type ListingItem,
} from './live-feed-parts';

/**
 * ListingCardCircular — Option D (pill-shaped card, circular thumb).
 *
 * Shape:
 *   ╭─────────────────────────────────────────╮
 *   │  ⭘  CARS · Al Quoz · Just now  [HOT]    │
 *   │ IMG  Range Rover Sport Autobiography    │
 *   │ 32   2024 · 3.0L · Warranty             │
 *   │  ⭘  • 41 watching • 31 saves • 4 inq.   │
 *   │         AED 620,000   Al Tayer ✓  [♥⇵→] │
 *   ╰─────────────────────────────────────────╯
 *
 * - Card is a pill (rounded-[2rem])
 * - Image is a circle (rounded-full, size-32)
 * - Everything else flows to the right in a flat horizontal layout
 * - No giant content gaps because the image is small + radial.
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

export const ListingCardCircular = ({ item, priceDrop = false }: Props) => {
  const rel = useRelativeTime(item.ts);
  const catColor = CAT_COLORS[item.cat] || 'currentColor';
  const catLabel = CAT_LABEL[item.cat] || '';
  const sig = hashSignals(item.id);

  const chips = (item.meta || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <motion.article
      layout
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className={
        'group relative flex items-center gap-4 rounded-[2rem] border pl-3 pr-5 py-3 transition-all duration-300 ' +
        (priceDrop
          ? 'border-[#e30613]/25 bg-gradient-to-r from-[#e30613]/[0.06] via-transparent to-transparent hover:border-[#e30613]/40'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]')
      }
    >
      {/* Circular image with ring in category color */}
      <div
        className="relative size-28 shrink-0 rounded-full p-[2px]"
        style={{ background: priceDrop ? '#e30613' : catColor, opacity: priceDrop ? 1 : 0.9 }}
      >
        <div className="relative size-full overflow-hidden rounded-full bg-foreground/5 ring-2 ring-background">
          <img
            src={item.image}
            alt={item.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
            loading="lazy"
          />
          {rel === 'Just now' && (
            <span className="absolute left-2 top-2 inline-flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: catColor }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full ring-2 ring-background"
                style={{ background: catColor }}
              />
            </span>
          )}
        </div>

        {/* Floating badge attached to image edge */}
        {(priceDrop || item.featured) && (
          <span
            className={
              'absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-lg ' +
              (priceDrop
                ? 'bg-[#e30613] text-white shadow-[#e30613]/30'
                : 'bg-[#C9A86A] text-[#1a1306]')
            }
          >
            {priceDrop ? `${Math.abs(item.drop ?? 0)}% OFF` : '◆ Featured'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Meta header — CATEGORY · loc · time · Hot */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-wider text-foreground/50">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/75">
            <span className="inline-block size-1 rounded-full" style={{ background: catColor }} />
            {catLabel}
          </span>
          <span className="text-foreground/25">·</span>
          <span className="truncate normal-case tracking-normal">{item.loc}</span>
          <span className="text-foreground/25">·</span>
          <span className="font-mono tabular-nums normal-case tracking-normal text-foreground/45">
            {rel}
          </span>
          {sig.hot && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
              </svg>
              Hot
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="truncate text-[16px] font-semibold leading-tight tracking-tight text-foreground">
          {item.title}
        </h3>

        {/* Chips inline */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-foreground/55">
            {chips.map((c, i) => (
              <span key={i} className="inline-flex items-center">
                {i > 0 && <span className="mr-1.5 text-foreground/20">·</span>}
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Signals row */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-foreground/55">
          <span className="inline-flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="tabular-nums font-medium text-foreground/80">{sig.watching}</span>
            <span className="text-foreground/40">watching</span>
          </span>
          <span className="text-foreground/20">•</span>
          <span>
            <span className="tabular-nums font-medium text-foreground/80">{sig.saves}</span>
            <span className="text-foreground/40"> saves</span>
          </span>
          <span className="text-foreground/20">•</span>
          <span>
            <span className="tabular-nums font-medium text-foreground/80">{sig.inquiries}</span>
            <span className="text-foreground/40"> inquiries</span>
          </span>
        </div>
      </div>

      {/* Right cluster: price + dealer + actions */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 self-center ps-3">
        {priceDrop && item.oldPrice && (
          <div className="inline-flex items-baseline gap-1.5 text-[10px]">
            <span className="text-foreground/35 line-through tabular-nums">{item.oldPrice}</span>
            <span className="font-semibold text-[#ff6b6b] tabular-nums">{item.drop}%</span>
          </div>
        )}
        <div className="text-[20px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {item.price}
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] text-foreground/55">
          <span className="max-w-[140px] truncate">{item.dealer}</span>
          {item.verified && (
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

        {/* Action pill — round cluster, hover-revealed */}
        <div className="mt-1 flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/[0.02] p-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
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
    className="flex size-7 items-center justify-center rounded-full text-foreground/55 transition hover:bg-foreground/[0.08] hover:text-foreground"
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

export default ListingCardCircular;
