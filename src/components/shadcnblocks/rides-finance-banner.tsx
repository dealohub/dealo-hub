'use client';

import { ArrowRight, Calculator, ShieldCheck, BadgePercent } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * RidesFinanceBanner — secondary full-width sponsored slot between
 * the main grid and the articles strip. Different partner (finance /
 * insurance) so the page carries two distinct ad surfaces rather
 * than two of the same.
 */

export const RidesFinanceBanner = () => {
  const t = useTranslations('marketplace.rides.finance');

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <article className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-emerald-950/60 via-emerald-900/40 to-teal-900/40 text-white shadow-lg transition-shadow hover:shadow-xl">
          {/* Decorative pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(700px 280px at 90% 0%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(500px 200px at 10% 100%, rgba(250,204,21,0.15), transparent 60%)',
            }}
          />

          <div className="relative grid gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:gap-12 md:p-10">
            {/* Left: stat + 3 pillars */}
            <div className="flex flex-col justify-center">
              <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-sm">
                {t('sponsored')}
              </div>

              <div className="font-calSans text-[44px] font-extrabold leading-none tracking-tight text-white md:text-[56px]">
                0<span className="text-[#facc15]">%</span>
                <span className="ms-2 text-[22px] font-semibold text-white/80 md:text-[26px]">APR</span>
              </div>
              <p className="mt-3 max-w-md text-[14px] text-white/80 md:text-[15px]">
                {t('pitch')}
              </p>

              {/* 3 pillars */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <Pillar icon={<ShieldCheck size={14} strokeWidth={2} />} label={t('pillar1')} />
                <Pillar icon={<BadgePercent size={14} strokeWidth={2} />} label={t('pillar2')} />
                <Pillar icon={<Calculator size={14} strokeWidth={2} />} label={t('pillar3')} />
              </div>
            </div>

            {/* Right: mini calculator card */}
            <div className="relative flex flex-col justify-center rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  {t('calcEyebrow')}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                  <Calculator size={10} />
                  {t('calcTag')}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label={t('fieldPrice')} value="AED 120,000" />
                <Field label={t('fieldDown')} value="20%" />
                <Field label={t('fieldTerm')} value="5 yr" />
                <Field label={t('fieldApr')} value="0.0%" accent="text-[#facc15]" />
              </div>

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">
                    {t('monthly')}
                  </p>
                  <p className="font-calSans text-[26px] font-extrabold leading-none tracking-tight text-white">
                    AED 1,600
                  </p>
                </div>
                <a
                  href="#"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-semibold text-emerald-950 transition hover:bg-white/90"
                >
                  {t('cta')}
                  <ArrowRight size={12} className="rtl:rotate-180" />
                </a>
              </div>
              <p className="mt-3 text-[9.5px] text-white/40">
                {t('disclosure')} <span className="font-medium text-white/60">NBK Finance</span> · {t('disclosureTail')}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

const Pillar = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-start gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
    <span className="grid size-7 place-items-center rounded-md bg-white/10 text-white/85">
      {icon}
    </span>
    <span className="text-[11px] font-medium leading-snug text-white/80">{label}</span>
  </div>
);

const Field = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
    <p className="text-[9px] uppercase tracking-wider text-white/45">{label}</p>
    <p className={'mt-0.5 text-[13px] font-semibold tabular-nums ' + (accent ?? 'text-white')}>
      {value}
    </p>
  </div>
);

export default RidesFinanceBanner;
