'use client';

import { motion } from 'framer-motion';
import {
  useRelativeTime,
  CAT_COLORS,
  CAT_LABEL,
  type ListingItem,
} from './live-feed-parts';

/**
 * ListingCardPolished — Option C (polish of the original side-by-side).
 *
 * Same overall shape as the handoff card, refined:
 *   - Larger image (w-60 · fixed 4:3)
 *   - Single top-left overlay that consolidates timestamp + badge
 *   - Photo count migrated into a slim footer chip
 *   - Signals in one row separated by bullets (not icons-per-signal)
 *   - Actions hidden until hover
 *   - Tightened spacing and typography
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

export const ListingCardPolished = ({ item, priceDrop = false }: Props) => {
  const rel = useRelativeTime(item.ts);
  const catColor = CAT_COLORS[item.cat] || 'currentColor';
  const catLabel = CAT_LABEL[item.cat] || '';
  const sig = hashSignals(item.id);

  const chips = (item.meta || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  // Consolidated top-left overlay: the single most important state
  // takes precedence (drop > featured > timestamp).
  const badge = priceDrop
    ? {
        content: (
          <>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            {Math.abs(item.drop ?? 0)}% off
          </>
        ),
        className:
          'bg-primary text-white shadow-lg shadow-primary/30',
      }
    : item.featured
      ? {
          content: <>◆ Featured</>,
          className:
            'border border-[#C9A86A]/40 bg-[#C9A86A]/10 text-[#E8C98D] backdrop-blur-md',
        }
      : null;

  return (
    <motion.article
      layout
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className={
        'group relative overflow-hidden rounded-xl border transition-all duration-300 ' +
        (priceDrop
          ? 'border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent hover:border-primary/40'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]')
      }
    >
      {/* Vertical category accent rail */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{ background: priceDrop ? 'var(--primary)' : catColor, opacity: priceDrop ? 0.7 : 0.35 }}
      />

      <div className="flex items-stretch gap-5 p-3 pl-4">
        {/* IMAGE — sized to sit closer to content height (3:2 instead of 4:3) */}
        <div className="relative aspect-[3/2] w-60 shrink-0 self-stretch overflow-hidden rounded-lg bg-foreground/5">
          <img
            src={item.image}
            alt={item.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* Top overlay: timestamp (always) + single badge (conditional) */}
          <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
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

            {badge && (
              <span
                className={
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ' +
                  badge.className
                }
              >
                {badge.content}
              </span>
            )}
          </div>

          {/* Bottom overlay: category + photo count */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span
                className="inline-block size-1 rounded-full"
                style={{ background: catColor }}
              />
              {catLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <circle cx="12" cy="13" r="3" />
                <path d="M8 6l1.5-2h5L16 6" />
              </svg>
              12
            </span>
          </div>
        </div>

        {/* CONTENT — footer pinned to bottom via mt-auto; title block
            + signals stack tightly at the top so there's no dead gap. */}
        <div className="flex min-w-0 flex-1 flex-col py-1">
          {/* Title + location */}
          <div className="min-w-0">
            <div className="mb-1 text-[11px] text-foreground/50">
              <span className="truncate">{item.loc}</span>
            </div>
            <h3 className="truncate text-[18px] font-semibold leading-tight tracking-tight text-foreground">
              {item.title}
            </h3>
            {chips.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
          </div>

          {/* Signals — one line, bullet-separated — sits right under title */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-foreground/55">
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
            {sig.hot && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                  <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
                </svg>
                Hot
              </span>
            )}
          </div>

          {/* Price + dealer + actions — pinned to bottom */}
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-foreground/10 pt-3">
            <div className="min-w-0">
              {priceDrop && item.oldPrice && (
                <div className="mb-0.5 inline-flex items-baseline gap-1.5 text-[11px]">
                  <span className="text-foreground/35 line-through tabular-nums">
                    {item.oldPrice}
                  </span>
                  <span className="font-semibold text-[#ff6b6b] tabular-nums">{item.drop}%</span>
                </div>
              )}
              <div className="text-[22px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {item.price}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-foreground/55">
                <span className="max-w-[180px] truncate">{item.dealer}</span>
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
            </div>

            {/* Actions: hidden until hover */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
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

export default ListingCardPolished;
