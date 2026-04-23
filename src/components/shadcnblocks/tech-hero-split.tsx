'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Sparkles, Mic, ArrowRight, ChevronLeft, Battery, Cpu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/format';
import type { ElectronicsCard } from '@/lib/electronics/types';

interface Props {
  totalLive: number;
  inspectedCount: number;
  featuredCard?: ElectronicsCard | null;
  locale: 'ar' | 'en';
}

export default function TechHeroSplit({ totalLive, inspectedCount, featuredCard, locale }: Props) {
  const t = useTranslations('electronicsHub');
  const [aiMode, setAiMode] = useState(false);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            'radial-gradient(1200px 500px at 10% 0%, rgba(227,6,19,0.05), transparent 60%), radial-gradient(900px 400px at 90% 0%, rgba(227,6,19,0.03), transparent 55%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[12px] text-foreground/55">
          <Link href={`/${locale}`} className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft size={12} className="rtl:rotate-180" />
            {t('breadcrumbHome')}
          </Link>
          <span className="text-foreground/25">/</span>
          <span className="font-medium text-foreground/85">{t('breadcrumbCurrent')}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <h1 className="font-calSans text-[42px] font-extrabold leading-[1.05] tracking-tight text-foreground md:text-[60px]">
              {t('headline')}
            </h1>
            <p className="mt-4 max-w-xl text-[14px] text-foreground/60 md:text-[16px]">
              {t('subline')}
            </p>

            {/* Search card */}
            <div className="mt-8 rounded-2xl border border-foreground/10 bg-background p-4 shadow-xl shadow-foreground/5 md:p-5">
              <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/3 p-1">
                <TabButton active={!aiMode} onClick={() => setAiMode(false)} icon={<Search size={12} />}>
                  {t('modeClassic')}
                </TabButton>
                <TabButton active={aiMode} onClick={() => setAiMode(true)} icon={<Sparkles size={12} />} ai>
                  {t('modeAI')}
                </TabButton>
              </div>

              <div className="relative flex items-center rounded-xl border border-foreground/15 bg-foreground/2 focus-within:border-foreground/40">
                <Search size={16} className="absolute start-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder={aiMode ? t('placeholderAI') : t('placeholderClassic')}
                  className="h-12 w-full rounded-xl border-0 bg-transparent ps-11 pe-24 text-[14px] text-foreground placeholder:text-foreground/40 outline-none"
                />
                <button
                  type="button"
                  aria-label={t('voice')}
                  className="absolute end-14 grid size-8 place-items-center rounded-full text-foreground/45 transition-colors duration-150 hover:bg-foreground/6 hover:text-foreground active:scale-95"
                >
                  <Mic size={14} />
                </button>
                <button
                  type="submit"
                  className="absolute end-1 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white shadow transition-colors duration-150 hover:bg-[#c80510] active:scale-[0.97]"
                >
                  {t('submit')}
                  <ArrowRight size={12} className="rtl:rotate-180" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                <QuickSelect label={t('anyCategory')} />
                <QuickSelect label={t('anyPrice')} />
                <QuickSelect label={t('anyCondition')} />
                <QuickSelect label={t('anyLocation')} />
              </div>

              <p className="mt-3 text-[11px] text-foreground/45">
                {t('advancedHint')}{' '}
                <a href="#" className="font-medium text-foreground/70 underline-offset-2 hover:underline">
                  {t('advancedLink')}
                </a>
              </p>
            </div>

            {/* Trust line */}
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-foreground/50">
              <span>
                <strong className="font-semibold text-foreground">{totalLive.toLocaleString('en-US')}</strong>
                {' '}{t('statsListings')}
              </span>
              {inspectedCount > 0 && (
                <>
                  <span aria-hidden className="text-foreground/20">·</span>
                  <span>
                    <strong className="font-semibold text-emerald-400">{inspectedCount.toLocaleString('en-US')}</strong>
                    {' '}{t('statsInspected')}
                  </span>
                </>
              )}
              <span aria-hidden className="text-foreground/20">·</span>
              <Link
                href={`/${locale}/sell/category`}
                className="font-medium text-primary transition hover:underline"
              >
                {t('sellCta')}
              </Link>
            </p>
          </motion.div>

          {/* RIGHT — featured device card */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] shadow-xl shadow-foreground/5"
          >
            <div className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-foreground/65 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-background backdrop-blur-md">
              {t('featuredListingLabel')}
            </div>

            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {featuredCard?.cover ? (
                <img
                  src={featuredCard.cover}
                  alt={featuredCard.title}
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop';
                  }}
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop"
                  alt=""
                  className="size-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

              {featuredCard?.verificationTier === 'dealo_inspected' && (
                <div className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {t('featuredInspected')}
                </div>
              )}

              {featuredCard && (
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                    {featuredCard.brand} · {featuredCard.cityName}
                  </p>
                  <h3 className="mt-1 font-calSans text-[20px] font-semibold leading-tight text-white line-clamp-2">
                    {featuredCard.title}
                  </h3>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-foreground/8 p-5">
              {featuredCard ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-calSans text-[22px] font-bold leading-none text-foreground">
                      {formatPrice(featuredCard.priceMinorUnits, featuredCard.currencyCode, locale)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {featuredCard.batteryHealthPct != null && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-foreground/60">
                          <Battery size={13} className="text-foreground/40" />
                          {featuredCard.batteryHealthPct}%
                        </span>
                      )}
                      {featuredCard.storageGb != null && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-foreground/60">
                          <Cpu size={11} className="text-foreground/40" />
                          {featuredCard.storageGb}GB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-wider text-foreground/50">
                      {featuredCard.model}
                    </p>
                    <Link
                      href={`/${locale}/tech/${featuredCard.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
                    >
                      {t('featuredCta')}
                      <ArrowRight size={12} className="rtl:rotate-180" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[13px] font-semibold text-foreground">{t('featuredBadge')}</p>
                  <Link
                    href={`/${locale}/categories/electronics`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
                  >
                    {t('featuredCta')}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}

const TabButton = ({
  active, onClick, icon, ai, children,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; ai?: boolean; children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 ' +
      (active
        ? ai ? 'bg-primary text-white shadow' : 'bg-foreground text-background'
        : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground')
    }
  >
    {icon}{children}
  </button>
);

const QuickSelect = ({ label }: { label: string }) => (
  <button
    type="button"
    className="inline-flex h-10 items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-foreground/2 px-3 text-[12px] font-medium text-foreground/75 transition-colors duration-150 hover:border-foreground/25 hover:bg-foreground/5 hover:text-foreground active:bg-foreground/8"
  >
    <span>{label}</span>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>
);
