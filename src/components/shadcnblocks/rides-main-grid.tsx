'use client';

import { useMemo, useState, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LayoutGrid, List, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ListingCardRides } from './listing-card-rides';
import type { RideCard } from '@/lib/rides/types';

/**
 * RidesMainGrid — the main browse grid.
 *
 * Uniform 4-col grid (Baymard: uniform > bento for comparative shopping).
 * Sort controls + sub-category chips + active filter display above.
 * Load-more pagination (client-side slicing for V1 given small inventory).
 *
 * Data flow (Phase 3c):
 *   Page (server) fetches all live automotive non-featured listings +
 *   the per-sub-category counts, then passes both down as props. This
 *   component stays client-side so filter / sort / load-more remain
 *   snappy without a round-trip per interaction. Once inventory grows
 *   past one page of realistic volume, we'll swap to true server-side
 *   pagination via a server action (tracked for Phase 4+).
 */

type SortKey = 'relevance' | 'priceAsc' | 'priceDesc' | 'newest' | 'popular';

interface TypeCount {
  slug: string;
  nameAr: string;
  nameEn: string;
  count: number;
}

interface Props {
  items: RideCard[];
  typeCounts: TypeCount[];
}

const INITIAL = 12;
const PAGE = 8;

/**
 * Small emoji map per automotive sub-category slug, kept UI-side
 * since emojis are design decoration, not data.
 */
const SUB_CAT_EMOJI: Record<string, string> = {
  'used-cars': '🚗',
  'new-cars': '🆕',
  'classic-cars': '🏎️',
  'junk-cars': '🔧',
  'wanted-cars': '🔍',
  motorcycles: '🏍️',
  watercraft: '🚤',
  cmvs: '🚚',
  'auto-spare-parts': '⚙️',
  'auto-accessories': '🎨',
  'auto-services': '🛠️',
  dealerships: '🏢',
  'car-garages': '🏚️',
  'car-rental-business': '🚙',
  'food-trucks': '🍔',
};

/** Visual accent per sub-category slug. Mirrors getRideCatColor. */
const SUB_CAT_ACCENT: Record<string, string> = {
  motorcycles: '#f59e0b',
  watercraft: '#0ea5e9',
  cmvs: '#78716c',
  'food-trucks': '#78716c',
};
const DEFAULT_ACCENT = '#ef4444';
const accentFor = (slug: string): string =>
  SUB_CAT_ACCENT[slug] ?? DEFAULT_ACCENT;

export const RidesMainGrid = ({ items, typeCounts }: Props) => {
  const t = useTranslations('marketplace.rides.main');
  const locale = useLocale() as 'ar' | 'en';

  const [activeSlug, setActiveSlug] = useState<string | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('relevance');
  const [visibleCount, setVisibleCount] = useState(INITIAL);

  const filtered = useMemo(() => {
    // 1. filter by sub-category slug
    let filtered =
      activeSlug === 'all'
        ? items
        : items.filter((l) => l.subCategorySlug === activeSlug);

    // 2. sort. 'popular' falls through to relevance since RideCard is
    // shallow — the server-side relevance order (is_hot first, then
    // newest) is the best approximation available client-side.
    switch (sortKey) {
      case 'priceAsc':
        filtered = [...filtered].sort(
          (a, b) => a.priceMinorUnits - b.priceMinorUnits,
        );
        break;
      case 'priceDesc':
        filtered = [...filtered].sort(
          (a, b) => b.priceMinorUnits - a.priceMinorUnits,
        );
        break;
      case 'newest':
        filtered = [...filtered].sort(
          (a, b) => (b.year ?? 0) - (a.year ?? 0),
        );
        break;
      case 'popular':
      case 'relevance':
      default:
        // Preserve the server's is_hot DESC + created_at DESC order
        break;
    }
    return filtered;
  }, [items, activeSlug, sortKey]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
              {t('title')}
            </h2>
            <p className="mt-1 text-[13px] text-foreground/55">
              {t('showingOf', {
                shown: visible.length,
                total: filtered.length,
              })}
            </p>
          </div>

          {/* Sort + view toggle */}
          <div className="flex items-center gap-2">
            <SortSelect value={sortKey} onChange={setSortKey} />
            <div className="hidden items-center gap-1 rounded-full border border-foreground/10 bg-foreground/[0.03] p-1 md:flex">
              <ViewToggleButton active>
                <LayoutGrid size={13} />
              </ViewToggleButton>
              <ViewToggleButton>
                <List size={13} />
              </ViewToggleButton>
            </div>
          </div>
        </div>

        {/* Sub-category chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip
            active={activeSlug === 'all'}
            onClick={() => setActiveSlug('all')}
          >
            {t('sortAllTypes')}
          </Chip>
          {typeCounts.map((tc) => (
            <Chip
              key={tc.slug}
              active={activeSlug === tc.slug}
              onClick={() => setActiveSlug(tc.slug)}
              accent={accentFor(tc.slug)}
            >
              <span>{SUB_CAT_EMOJI[tc.slug] ?? '•'}</span>
              <span>{locale === 'ar' ? tc.nameAr : tc.nameEn}</span>
              <span className="tabular-nums text-[10.5px] opacity-70">
                {tc.count}
              </span>
            </Chip>
          ))}
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence initial={false}>
                {visible.map((item, idx) => (
                  <Fragment key={item.id}>
                    <ListingCardRides item={item} />
                    {/* Drop a sponsored card after every 7 real listings */}
                    {idx > 0 && (idx + 1) % 7 === 0 && <SponsoredCard />}
                  </Fragment>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination footer */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex w-full max-w-md flex-col items-center gap-2">
                <div className="flex w-full items-center justify-between text-[11px] text-foreground/50">
                  <span>
                    {t('showingOf', {
                      shown: visible.length,
                      total: filtered.length,
                    })}
                  </span>
                  <span className="tabular-nums">
                    {Math.round(
                      (visible.length / Math.max(filtered.length, 1)) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                  <motion.div
                    className="h-full rounded-full bg-foreground/70"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(visible.length / Math.max(filtered.length, 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                  />
                </div>
              </div>

              {visibleCount < filtered.length ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((c) => Math.min(c + PAGE, filtered.length))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
                >
                  {t('loadMoreCount', {
                    count: Math.min(PAGE, filtered.length - visibleCount),
                  })}
                </button>
              ) : (
                <p className="text-[11px] font-medium text-foreground/50">
                  {t('allLoaded')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

// ─── Subcomponents (unchanged, but kept local) ──────────────────────────

const SortSelect = ({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) => {
  const t = useTranslations('marketplace.rides.main.sort');
  const options: { key: SortKey; label: string }[] = [
    { key: 'relevance', label: t('relevance') },
    { key: 'priceAsc', label: t('priceAsc') },
    { key: 'priceDesc', label: t('priceDesc') },
    { key: 'newest', label: t('newest') },
    { key: 'popular', label: t('popular') },
  ];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-9 appearance-none rounded-full border border-foreground/10 bg-foreground/[0.03] pe-8 ps-3 text-[12px] font-medium text-foreground/80 outline-none transition hover:border-foreground/25 hover:bg-foreground/[0.06]"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {t('prefix')}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-foreground/45"
      />
    </div>
  );
};

const ViewToggleButton = ({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) => (
  <button
    type="button"
    className={
      'grid size-7 place-items-center rounded-full transition ' +
      (active
        ? 'bg-foreground text-background'
        : 'text-foreground/50 hover:bg-foreground/[0.06] hover:text-foreground')
    }
  >
    {children}
  </button>
);

const Chip = ({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition ' +
      (active
        ? 'border-foreground/40 bg-foreground text-background'
        : 'border-foreground/10 bg-foreground/[0.03] text-foreground/75 hover:border-foreground/25 hover:bg-foreground/[0.06]')
    }
    style={
      active && accent
        ? { borderColor: accent, background: accent, color: 'white' }
        : undefined
    }
  >
    {children}
  </button>
);

const SponsoredCard = () => {
  const t = useTranslations('marketplace.rides.sponsoredCard');
  return (
    <motion.article
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-[#C9A86A]/40 bg-gradient-to-br from-[#C9A86A]/[0.05] via-transparent to-transparent p-5 shadow-sm transition-all duration-300 hover:border-[#C9A86A]/70 hover:shadow-lg"
    >
      <div className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/50 bg-[#C9A86A]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#C9A86A]">
        {t('sponsored')}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-xl bg-[#C9A86A]/15 text-[14px] font-extrabold tracking-tight text-[#C9A86A]">
          AL
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">AL-Futtaim Motors</p>
          <p className="text-[10px] uppercase tracking-wider text-foreground/45">
            {t('dealer')}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">
        {t('headline')}
      </p>
      <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-foreground/55">
        {t('body')}
      </p>

      <div className="mt-auto pt-5">
        <a
          href="#"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground py-2.5 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
        >
          {t('cta')}
          <ArrowRight size={12} className="rtl:rotate-180" />
        </a>
      </div>
    </motion.article>
  );
};

const EmptyState = () => {
  const t = useTranslations('marketplace.rides.empty');
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-6 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-foreground/[0.05] text-foreground/50">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
        <p className="mt-1 max-w-sm text-sm text-foreground/55">
          {t('subtitle')}
        </p>
      </div>
    </div>
  );
};

export default RidesMainGrid;
