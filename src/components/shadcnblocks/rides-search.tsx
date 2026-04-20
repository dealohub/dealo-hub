'use client';

import { useState } from 'react';
import { Search, Sparkles, Mic, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VEHICLE_TYPES, VEHICLE_COLORS, type VehicleType } from './rides-data';

/**
 * RidesSearch — smart search strip + sub-type chips + quick filters.
 * AI mode toggle is visual only in this iteration; wiring to embeddings
 * lands in phase 2.
 */

interface Props {
  activeType: VehicleType | 'all';
  onTypeChange: (t: VehicleType | 'all') => void;
}

export const RidesSearch = ({ activeType, onTypeChange }: Props) => {
  const t = useTranslations('marketplace.rides.search');
  const tTypes = useTranslations('marketplace.rides.types');
  const [aiMode, setAiMode] = useState(false);

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Search box */}
        <div className="mx-auto flex max-w-3xl items-stretch gap-2">
          {/* Mode toggle */}
          <div className="hidden items-center rounded-full border border-foreground/10 bg-foreground/[0.03] p-1 md:flex">
            <button
              type="button"
              onClick={() => setAiMode(false)}
              className={
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider transition ' +
                (!aiMode ? 'bg-foreground text-background' : 'text-foreground/60 hover:text-foreground')
              }
            >
              <Search size={12} />
              {t('modeClassic')}
            </button>
            <button
              type="button"
              onClick={() => setAiMode(true)}
              className={
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider transition ' +
                (aiMode ? 'bg-gradient-to-r from-[#a855f7] to-[#3b82f6] text-white' : 'text-foreground/60 hover:text-foreground')
              }
            >
              <Sparkles size={12} />
              {t('modeAI')}
            </button>
          </div>

          <div className="relative flex flex-1 items-center rounded-full border border-foreground/15 bg-background shadow-sm focus-within:border-foreground/40">
            <Search size={16} className="absolute start-4 text-foreground/40" />
            <input
              type="text"
              placeholder={aiMode ? t('placeholderAI') : t('placeholderClassic')}
              className="h-12 w-full rounded-full border-0 bg-transparent ps-11 pe-24 text-[14px] text-foreground placeholder:text-foreground/40 outline-none"
            />
            <button
              type="button"
              aria-label={t('voice')}
              className="absolute end-14 grid size-8 place-items-center rounded-full text-foreground/50 transition hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <Mic size={14} />
            </button>
            <button
              type="submit"
              className="absolute end-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#e30613] px-4 text-[12px] font-semibold text-white shadow transition hover:bg-[#c80510]"
            >
              {t('submit')}
            </button>
          </div>
        </div>

        {/* Sub-type chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Chip
            active={activeType === 'all'}
            onClick={() => onTypeChange('all')}
            label={t('typeAll')}
          />
          {VEHICLE_TYPES.map(({ key, emoji }) => (
            <Chip
              key={key}
              active={activeType === key}
              onClick={() => onTypeChange(key)}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <span>{emoji}</span>
                  <span>{tTypes(key)}</span>
                </span>
              }
              accent={VEHICLE_COLORS[key]}
            />
          ))}
        </div>

        {/* Quick filters strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <QuickFilter label={t('filterPrice')} />
          <QuickFilter label={t('filterYear')} />
          <QuickFilter label={t('filterLocation')} />
          <QuickFilter label={t('filterSellerType')} />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 text-[12px] font-medium text-foreground/75 transition hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <SlidersHorizontal size={12} />
            {t('filterAdvanced')}
          </button>
        </div>
      </div>
    </section>
  );
};

const Chip = ({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
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
    style={active && accent ? { borderColor: accent, background: accent, color: 'white' } : undefined}
  >
    {label}
  </button>
);

const QuickFilter = ({ label }: { label: string }) => (
  <button
    type="button"
    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 text-[12px] font-medium text-foreground/75 transition hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
  >
    {label}
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>
);

export default RidesSearch;
