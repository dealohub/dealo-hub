'use client';

import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* LiveFeedParts — sub-components for LiveFeed */

// ─── Types ────────────────────────────────────────────────────
export type CategoryKey = 'cars' | 'property' | 'tech' | 'jobs';

export interface ListingItem {
  kind: 'listing' | 'pricedrop';
  id: string | number;
  cat: CategoryKey;
  title: string;
  meta?: string;
  price: string;
  oldPrice?: string;
  drop?: number;
  loc: string;
  dealer: string;
  verified?: boolean;
  featured?: boolean;
  image: string;
  ts: number;
}

export interface SignalItem {
  kind: 'signal';
  id: string | number;
  text: string;
  ts: number;
}

export type FeedItem = ListingItem | SignalItem;

// ─── Relative time helper ────────────────────────────────────
export const useRelativeTime = (ts: number) => {
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return 'Just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
};

// ─── Category color dots ─────────────────────────────────────
export const CAT_COLORS: Record<CategoryKey, string> = {
  cars: '#ef4444',
  property: '#3b82f6',
  tech: '#a855f7',
  jobs: '#10b981',
};
export const CAT_LABEL: Record<CategoryKey, string> = {
  cars: 'Cars',
  property: 'Property',
  tech: 'Tech',
  jobs: 'Jobs',
};

// ─── Live status bar ─────────────────────────────────────────
export const LiveStatusBar = ({ feed: _feed }: { feed: FeedItem[] }) => {
  const spark = useMemo(() => {
    const pts = Array.from({ length: 30 }, (_, i) => {
      const base = 18 + Math.sin(i / 3) * 4 + (i / 30) * 6;
      const noise = ((i * 13) % 7) * 0.8;
      return base + noise;
    });
    return pts;
  }, []);

  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const path = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min || 1)) * 100;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="sticky top-0 z-30 w-full border-b border-foreground/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e30613] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e30613]" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/90">Live</span>
        </div>

        <div className="flex items-center gap-8 text-xs">
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tabular-nums text-foreground">12,847</span>
            <span className="text-foreground/40">active</span>
          </div>
          <div className="hidden items-baseline gap-1.5 md:flex">
            <span className="font-semibold tabular-nums text-foreground">324</span>
            <span className="text-foreground/40">new today</span>
          </div>
          <div className="hidden items-baseline gap-1.5 md:flex">
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-400">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              18%
            </span>
            <span className="text-foreground/40">vs yesterday</span>
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <span className="text-[10px] uppercase tracking-wider text-foreground/40">Last 60 min</span>
          <svg width="120" height="24" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
            <path d={path} fill="none" stroke="#e30613" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="100" cy={100 - ((spark[spark.length - 1] - min) / (max - min || 1)) * 100} r="3" fill="#e30613" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Feed header — centered ──────────────────────────────────
export const FeedHeader = () => (
  <div className="mb-8 flex flex-col items-center text-center">
    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Verified partners · Live
    </div>
    <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-[38px]">
      Fresh from our partners
    </h2>
    <p className="mt-2 max-w-xl text-sm text-foreground/50">
      A curated snapshot of the latest premium listings from verified dealers and developers across the UAE.
    </p>
    <a
      href="#"
      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60 transition hover:text-foreground"
    >
      View full live feed
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </a>
  </div>
);

// ─── Filter pills ────────────────────────────────────────────
export const FilterPills = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const pills: { id: string; label: string; dot?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'cars', label: 'Cars', dot: CAT_COLORS.cars },
    { id: 'property', label: 'Property', dot: CAT_COLORS.property },
    { id: 'tech', label: 'Tech', dot: CAT_COLORS.tech },
    { id: 'featured', label: 'Featured' },
    { id: 'pricedrop', label: 'Price drops' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-foreground/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pills.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={
              'relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-xs font-medium transition ' +
              (active ? 'text-foreground' : 'text-foreground/50 hover:text-foreground/80')
            }
          >
            {p.dot && <span className="inline-block size-1.5 rounded-full" style={{ background: p.dot }} />}
            {p.label}
            {active && <span className="absolute inset-x-0 -bottom-px h-px bg-[#e30613]" />}
          </button>
        );
      })}
    </div>
  );
};

// Deterministic pseudo-random
const hashSignals = (id: string | number) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  // Use unsigned right shift so bits past 31 don't flip the sign
  // and produce negative counts.
  const watching = 3 + (h % 52);
  const saves = 8 + ((h >>> 3) % 240);
  const inquiries = 1 + ((h >>> 7) % 28);
  const hot = watching >= 20 || inquiries >= 15;
  return { watching, saves, inquiries, hot };
};

// Tiny square icon button — used in card actions row
const IconActionButton = ({ children, label }: { children: ReactNode; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex size-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.02] text-foreground/50 transition hover:border-foreground/20 hover:bg-foreground/[0.06] hover:text-foreground"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </button>
);

// ─── Listing card ────────────────────────────────────────────
export const ListingCard = ({ item, priceDrop = false }: { item: ListingItem; priceDrop?: boolean }) => {
  const rel = useRelativeTime(item.ts);
  const catColor = CAT_COLORS[item.cat] || '#ffffff';
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
        'group relative overflow-hidden rounded-xl border transition-all duration-300 ' +
        (priceDrop
          ? 'border-[#e30613]/25 bg-gradient-to-br from-[#e30613]/[0.06] to-transparent hover:border-[#e30613]/40'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]')
      }
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{ background: priceDrop ? '#e30613' : catColor, opacity: priceDrop ? 0.7 : 0.4 }}
      />

      <div className="flex items-stretch gap-5 p-3 pl-4">
        <div className="relative aspect-[4/3] w-44 shrink-0 overflow-hidden rounded-lg bg-foreground/5 md:w-52">
          <img
            src={item.image}
            alt=""
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              {rel === 'Just now' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: catColor }} />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: catColor }} />
            </span>
            <span className="font-mono tabular-nums">{rel}</span>
          </div>

          {item.featured && !priceDrop && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#E8C98D] backdrop-blur-sm">
              ◆ Featured
            </span>
          )}
          {priceDrop && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-[#e30613] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#e30613]/30">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              {Math.abs(item.drop ?? 0)}% off
            </span>
          )}

          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <circle cx="12" cy="13" r="3" />
              <path d="M8 6l1.5-2h5L16 6" />
            </svg>
            12
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-1">
          <div className="flex items-center gap-2 text-[11px] text-foreground/50">
            <span className="inline-flex items-center gap-1.5 text-foreground/70">
              <span className="inline-block size-1.5 rounded-full" style={{ background: catColor }} />
              <span className="font-medium uppercase tracking-wider text-[10px]">{catLabel}</span>
            </span>
            <span className="text-foreground/20">/</span>
            <span className="truncate">{item.loc}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[17px] font-medium leading-tight tracking-tight text-foreground">
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
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
              <span className="text-foreground/40">inquiries today</span>
            </span>

            {sig.hot && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                  <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                </svg>
                Hot
              </span>
            )}
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-foreground/5 pt-3">
            <div className="min-w-0">
              {priceDrop && (
                <div className="mb-0.5 inline-flex items-baseline gap-1.5 text-[11px]">
                  <span className="text-foreground/30 line-through tabular-nums">{item.oldPrice}</span>
                  <span className="font-semibold text-[#ff6b6b] tabular-nums">{item.drop}%</span>
                </div>
              )}
              <div className="text-[22px] font-semibold tracking-tight text-foreground tabular-nums leading-none">
                {item.price}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 text-[11px] text-foreground/55">
                <span className="truncate max-w-[120px]">{item.dealer}</span>
                {item.verified && (
                  <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z" fill="#3B82F6" />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1">
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
      </div>
    </motion.article>
  );
};

// ─── Activity signal (divider-style) ─────────────────────────
export const SignalRow = ({ item }: { item: SignalItem }) => {
  const rel = useRelativeTime(item.ts);
  return (
    <motion.div
      layout
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex items-center gap-3 px-1 py-1"
    >
      <span className="h-px flex-1 bg-foreground/10" />
      <span className="inline-flex items-center gap-2 text-[11px] text-foreground/45">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/80">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.2" />
        </svg>
        <span>{item.text}</span>
        <span className="text-foreground/30">· {rel}</span>
      </span>
      <span className="h-px flex-1 bg-foreground/10" />
    </motion.div>
  );
};

// ─── Featured Partners (standalone full-width section) ────────
const PARTNERS = [
  { name: 'Al-Futtaim Motors', kind: 'Automotive',  tagline: 'Official Toyota, Lexus, Honda distributor',      logo: 'AF', tint: '#ef4444', stats: { listings: '1,248', years: '24 yrs', rating: '4.9' } },
  { name: 'Emaar Properties',  kind: 'Real Estate', tagline: 'Developer of Downtown Dubai & Marina',           logo: 'EM', tint: '#3b82f6', stats: { listings: '892',   years: '28 yrs', rating: '4.8' } },
  { name: 'Damac Properties',  kind: 'Real Estate', tagline: 'Luxury developer · 12,000+ units delivered',     logo: 'DM', tint: '#3b82f6', stats: { listings: '634',   years: '22 yrs', rating: '4.7' } },
  { name: 'Gargash Motors',    kind: 'Automotive',  tagline: 'Official Mercedes-Benz dealer',                  logo: 'GM', tint: '#ef4444', stats: { listings: '446',   years: '61 yrs', rating: '4.9' } },
];

export const FeaturedPartnersSection = () => (
  <section className="relative w-full bg-background">
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Centered header */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
          <span className="h-px w-6 bg-foreground/20" />
          Featured partners
          <span className="h-px w-6 bg-foreground/20" />
        </div>
        <h2 className="font-calSans text-3xl font-semibold tracking-tight text-foreground md:text-[34px]">
          The names you already trust
        </h2>
        <p className="mt-2 max-w-xl text-sm text-foreground/55">
          Verified dealers and developers who've chosen Dealo Hub as a
          listing channel — because our buyers are pre-qualified.
        </p>
      </div>

      {/* 4-col partner grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PARTNERS.map((p) => (
          <article
            key={p.name}
            className="group relative overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-foreground/5"
          >
            <span aria-hidden className="absolute left-0 top-0 h-full w-[2px] opacity-50" style={{ background: p.tint }} />

            <div className="flex items-center gap-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-tight"
                style={{ background: `${p.tint}1a`, color: p.tint }}
              >
                {p.logo}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-foreground">{p.name}</p>
                  <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z" fill="#3B82F6" />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/40">{p.kind}</p>
              </div>
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-foreground/55 line-clamp-2 min-h-[2.4em]">
              {p.tagline}
            </p>

            <div className="mt-4 flex items-center gap-3 border-t border-foreground/5 pt-3 text-[10px]">
              <div>
                <div className="font-semibold tabular-nums text-foreground/90">{p.stats.listings}</div>
                <div className="text-foreground/40">listings</div>
              </div>
              <div className="h-7 w-px bg-foreground/10" />
              <div>
                <div className="font-semibold tabular-nums text-foreground/90">{p.stats.years}</div>
                <div className="text-foreground/40">active</div>
              </div>
              <div className="h-7 w-px bg-foreground/10" />
              <div>
                <div className="inline-flex items-center gap-0.5 font-semibold tabular-nums text-foreground/90">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {p.stats.rating}
                </div>
                <div className="text-foreground/40">rating</div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Browse-all CTA */}
      <a
        href="#"
        className="mx-auto mt-8 flex w-fit items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-5 py-2.5 text-[12px] font-medium text-foreground/70 transition hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
      >
        Browse all 240+ partners
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </a>

      {/* Market pulse — slim strip */}
      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 divide-x divide-foreground/10 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-center rtl:divide-x-reverse">
        <div className="px-6 py-5">
          <div className="text-[22px] font-semibold tabular-nums text-foreground">247</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-foreground/50">Total partners</div>
        </div>
        <div className="px-6 py-5">
          <div className="text-[22px] font-semibold tabular-nums text-foreground">12,847</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-foreground/50">Premium listings</div>
        </div>
        <div className="px-6 py-5">
          <div className="inline-flex items-baseline gap-1 text-[22px] font-semibold tabular-nums text-emerald-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            +12%
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-foreground/50">Partner growth</div>
        </div>
      </div>
    </div>
  </section>
);
