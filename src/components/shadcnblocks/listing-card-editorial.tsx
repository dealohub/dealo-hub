'use client';

import { motion } from 'framer-motion';
import {
  useRelativeTime,
  CAT_COLORS,
  CAT_LABEL,
  type ListingItem,
} from './live-feed-parts';

/**
 * ListingCardEditorial — Option A redesign (magazine-style grid).
 *
 * Layout:
 *   ┌────────────────────────────┐
 *   │          IMAGE 16:9        │
 *   │  [timestamp]    [badge]    │
 *   └────────────────────────────┘
 *   CATEGORY · location
 *   Large title
 *   [chips]
 *   ─────────────────────────────
 *   signals row
 *   ─────────────────────────────
 *   Price                ♥  ⇵  →
 *   Dealer · verified
 *
 * Intended to render in a lg:grid-cols-2 container.
 */

// deterministic signals — mirrors hashSignals in live-feed-parts
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

export const ListingCardEditorial = ({ item, priceDrop = false }: Props) => {
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
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className={
        'group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ' +
        (priceDrop
          ? 'border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent hover:border-primary/40'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]')
      }
    >
      {/* ─── IMAGE: 16:9 full-bleed ─────────────────────────── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-foreground/5">
        <img
          src={item.image}
          alt={item.title}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Gradient fade for badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top-left: timestamp (glass) */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            {rel === 'Just now' && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: catColor }}
              />
            )}
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: catColor }}
            />
          </span>
          <span className="font-mono tabular-nums">{rel}</span>
        </div>

        {/* Top-right: badge */}
        {priceDrop ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary/30">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            {Math.abs(item.drop ?? 0)}% off
          </span>
        ) : item.featured ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#E8C98D] backdrop-blur-sm">
            ◆ Featured
          </span>
        ) : null}

        {/* Bottom-left: category pill */}
        <span
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md"
          style={{ color: '#fff' }}
        >
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: catColor }}
          />
          {catLabel}
        </span>

        {/* Bottom-right: photo count */}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <circle cx="12" cy="13" r="3" />
            <path d="M8 6l1.5-2h5L16 6" />
          </svg>
          12
        </span>
      </div>

      {/* ─── BODY ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Location (category is already on the image) */}
        <div className="text-[11px] text-foreground/50">
          <span className="truncate">{item.loc}</span>
        </div>

        {/* Title */}
        <h3 className="text-[19px] font-semibold leading-tight tracking-tight text-foreground">
          {item.title}
        </h3>

        {/* Spec chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 py-0.5 text-[10px] font-medium text-foreground/60"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Live signals row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-foreground/10 pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-foreground/55">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="tabular-nums font-medium text-foreground/75">{sig.watching}</span>
            <span className="text-foreground/40">watching</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-foreground/55">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="tabular-nums font-medium text-foreground/75">{sig.saves}</span>
            <span className="text-foreground/40">saves</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-foreground/55">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="tabular-nums font-medium text-foreground/75">{sig.inquiries}</span>
            <span className="text-foreground/40">inquiries</span>
          </span>

          {sig.hot && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
              </svg>
              Hot
            </span>
          )}
        </div>

        {/* Price + Actions footer */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-foreground/10 pt-3">
          <div className="min-w-0">
            {priceDrop && (
              <div className="mb-0.5 inline-flex items-baseline gap-1.5 text-[11px]">
                <span className="text-foreground/35 line-through tabular-nums">{item.oldPrice}</span>
                <span className="font-semibold text-[#ff6b6b] tabular-nums">{item.drop}%</span>
              </div>
            )}
            <div className="text-[24px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
              {item.price}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-foreground/55">
              <span className="truncate">{item.dealer}</span>
              {item.verified && (
                <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
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

          <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
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
    className="flex size-8 items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.02] text-foreground/50 transition hover:border-foreground/20 hover:bg-foreground/[0.06] hover:text-foreground"
  >
    <svg
      width="13"
      height="13"
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

export default ListingCardEditorial;
