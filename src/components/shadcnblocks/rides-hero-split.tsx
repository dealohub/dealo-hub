'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Sparkles, Mic, ArrowRight, ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * RidesHeroSplit — landing hero for /rides.
 *
 * Left: search card with Classic / AI tabs, ZIP + make/model quick inputs,
 *       primary search CTA.
 * Right: sponsored dealer spotlight card — big image, award badge,
 *        sponsor label, CTA. Transparent paid placement.
 *
 * Inspired by Autotrader and Cars.com, adapted for the 2026 warm-stone
 * palette with the Dealo Hub brand accent (red primary for CTAs).
 */

export const RidesHeroSplit = () => {
  const t = useTranslations('marketplace.rides');
  const th = useTranslations('marketplace.rides.hero');
  const [aiMode, setAiMode] = useState(false);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* Background texture — subtle radial accent */}
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
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft size={12} className="rtl:rotate-180" />
            {t('header.breadcrumbHome')}
          </Link>
          <span className="text-foreground/25">/</span>
          <span className="font-medium text-foreground/85">{t('header.breadcrumbCurrent')}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT — title + search card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <h1 className="font-calSans text-[42px] font-extrabold leading-[1.05] tracking-tight text-foreground md:text-[60px]">
              {th('title')}
            </h1>
            <p className="mt-4 max-w-xl text-[14px] text-foreground/60 md:text-[16px]">
              {th('subtitle')}
            </p>

            {/* Search card */}
            <div className="mt-8 rounded-2xl border border-foreground/10 bg-background p-4 shadow-xl shadow-foreground/5 md:p-5">
              {/* Mode toggle */}
              <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/3 p-1">
                <TabButton active={!aiMode} onClick={() => setAiMode(false)} icon={<Search size={12} />}>
                  {th('modeClassic')}
                </TabButton>
                <TabButton active={aiMode} onClick={() => setAiMode(true)} icon={<Sparkles size={12} />} ai>
                  {th('modeAI')}
                </TabButton>
              </div>

              {/* Search input */}
              <div className="relative flex items-center rounded-xl border border-foreground/15 bg-foreground/2 focus-within:border-foreground/40">
                <Search size={16} className="absolute start-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder={aiMode ? th('placeholderAI') : th('placeholderClassic')}
                  className="h-12 w-full rounded-xl border-0 bg-transparent ps-11 pe-24 text-[14px] text-foreground placeholder:text-foreground/40 outline-none"
                />
                <button
                  type="button"
                  aria-label={th('voice')}
                  className="absolute end-14 grid size-8 place-items-center rounded-full text-foreground/45 transition-colors duration-150 hover:bg-foreground/6 hover:text-foreground active:scale-95"
                >
                  <Mic size={14} />
                </button>
                <button
                  type="submit"
                  className="absolute end-1 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white shadow transition-colors duration-150 hover:bg-[#c80510] active:scale-[0.97]"
                >
                  {th('submit')}
                  <ArrowRight size={12} className="rtl:rotate-180" />
                </button>
              </div>

              {/* Quick selects row */}
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                <QuickSelect label={th('anyMake')} />
                <QuickSelect label={th('anyModel')} />
                <QuickSelect label={th('anyYear')} />
                <QuickSelect label={th('anyLocation')} />
              </div>

              <p className="mt-3 text-[11px] text-foreground/45">
                {th('advancedHint')}{' '}
                <a href="#" className="font-medium text-foreground/70 underline-offset-2 hover:underline">
                  {th('advancedLink')}
                </a>
              </p>
            </div>
          </motion.div>

          {/* RIGHT — sponsored dealer card */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] shadow-xl shadow-foreground/5"
          >
            {/* Sponsored label */}
            <div className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-foreground/65 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-background backdrop-blur-md">
              {th('sponsored')}
            </div>

            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&auto=format&fit=crop"
                alt=""
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

              {/* Award ribbon */}
              <div className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#C9A86A]/60 bg-[#C9A86A]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8C98D] backdrop-blur-md">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {th('sponsorTag')}
              </div>

              {/* Overlay text */}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  {th('sponsorEyebrow')}
                </p>
                <h3 className="mt-1 font-calSans text-[22px] font-semibold leading-tight text-white">
                  {th('sponsorTitle')}
                </h3>
              </div>
            </div>

            {/* Card body */}
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    Gargash Motors
                  </p>
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
                </div>
                <p className="text-[11px] uppercase tracking-wider text-foreground/50">
                  {th('sponsorDealer')}
                </p>
              </div>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
              >
                {th('sponsorCta')}
                <ArrowRight size={12} className="rtl:rotate-180" />
              </a>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
};

const TabButton = ({
  active,
  onClick,
  icon,
  ai,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  ai?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 ' +
      (active
        ? ai
          ? 'bg-primary text-white shadow'
          : 'bg-foreground text-background'
        : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground')
    }
  >
    {icon}
    {children}
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

export default RidesHeroSplit;
