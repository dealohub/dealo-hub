'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { ArrowRight, Calculator, ShieldCheck, BadgePercent } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * RidesFinanceBanner — animated sponsored banner for NBK Finance.
 * Features:
 *   - Shimmer gradient sweeping across the background
 *   - "0%" glyph pulses softly
 *   - Monthly payment counts up from 0 → 1,600 when in view
 *   - Stat pillars stagger in
 *   - Card rotates in on scroll
 */

export const RidesFinanceBanner = () => {
  const t = useTranslations('marketplace.rides.finance');
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-emerald-950/80 via-emerald-900/50 to-teal-900/40 text-white shadow-lg transition-shadow hover:shadow-xl"
        >
          {/* Layer 1: base radial wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(700px 280px at 90% 0%, rgba(16,185,129,0.25), transparent 55%), radial-gradient(500px 200px at 10% 100%, rgba(250,204,21,0.2), transparent 60%)',
            }}
          />

          {/* Layer 2: shimmer sweep */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -inset-x-full"
            style={{
              background:
                'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 2,
            }}
          />

          {/* Layer 3: floating orbs */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-emerald-400/10 blur-3xl"
            animate={{
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-yellow-400/10 blur-3xl"
            animate={{
              x: [0, -15, 10, 0],
              y: [0, 15, -10, 0],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative grid gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:gap-12 md:p-10">
            {/* LEFT — pulsing 0% + pitch */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col justify-center"
            >
              <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                {t('sponsored')}
              </div>

              {/* Animated pulsing 0% */}
              <div className="font-calSans flex items-baseline gap-2 font-extrabold leading-none tracking-tight text-white">
                <motion.span
                  className="inline-block text-[64px] md:text-[88px]"
                  animate={{
                    scale: [1, 1.03, 1],
                    textShadow: [
                      '0 0 0px rgba(250,204,21,0)',
                      '0 0 24px rgba(250,204,21,0.45)',
                      '0 0 0px rgba(250,204,21,0)',
                    ],
                  }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  0
                </motion.span>
                <span className="text-[#facc15] text-[56px] md:text-[72px]">%</span>
                <span className="ms-2 text-[22px] font-semibold text-white/80 md:text-[26px]">
                  APR
                </span>
              </div>

              <p className="mt-3 max-w-md text-[14px] text-white/80 md:text-[15px]">
                {t('pitch')}
              </p>

              {/* 3 pillars — stagger in */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: <ShieldCheck size={14} strokeWidth={2} />, label: t('pillar1') },
                  { icon: <BadgePercent size={14} strokeWidth={2} />, label: t('pillar2') },
                  { icon: <Calculator size={14} strokeWidth={2} />, label: t('pillar3') },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    className="flex flex-col items-start gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <span className="grid size-7 place-items-center rounded-md bg-white/10 text-white/85">
                      {p.icon}
                    </span>
                    <span className="text-[11px] font-medium leading-snug text-white/80">
                      {p.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — mini calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotateY: 6 }}
              animate={inView ? { opacity: 1, y: 0, rotateY: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative flex flex-col justify-center rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm md:p-6"
            >
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
                  <div className="font-calSans text-[26px] font-extrabold leading-none tracking-tight text-white">
                    <AnimatedAED from={0} to={1600} inView={inView} />
                  </div>
                </div>
                <a
                  href="#"
                  className="group/btn inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-semibold text-emerald-950 transition hover:bg-white/90"
                >
                  {t('cta')}
                  <ArrowRight
                    size={12}
                    className="transition-transform duration-300 group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5"
                  />
                </a>
              </div>
              <p className="mt-3 text-[9.5px] text-white/40">
                {t('disclosure')} <span className="font-medium text-white/60">NBK Finance</span> ·{' '}
                {t('disclosureTail')}
              </p>
            </motion.div>
          </div>
        </motion.article>
      </div>
    </section>
  );
};

const Field = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors duration-300 hover:border-white/25">
    <p className="text-[9px] uppercase tracking-wider text-white/45">{label}</p>
    <p className={'mt-0.5 text-[13px] font-semibold tabular-nums ' + (accent ?? 'text-white')}>
      {value}
    </p>
  </div>
);

/** Counts a numeric value from `from` to `to` once its host scrolls into view. */
const AnimatedAED = ({
  from,
  to,
  inView,
}: {
  from: number;
  to: number;
  inView: boolean;
}) => {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, to, {
      duration: 1.4,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [from, to, inView]);

  return (
    <span className="tabular-nums">
      AED {Math.round(value).toLocaleString('en-US')}
    </span>
  );
};

export default RidesFinanceBanner;
