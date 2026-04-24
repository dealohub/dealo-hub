'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import {
  ArrowRight,
  Calculator,
  Zap,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * TechTradeInBanner — animated sponsored banner for the Tech hub.
 *
 * Visual sibling of RidesFinanceBanner (NBK) but a distinct palette
 * (amber / yellow on deep brown) so the two anchor banners read as
 * different offers when the user moves between hubs:
 *
 *   - Shimmer gradient sweeping across the background
 *   - "AED" payout number counts up from 0 → 1,800 when in view
 *   - "INSTANT" pill rocks subtly to draw the eye
 *   - 3 pillars stagger in (instant cash · no fee · same-day pickup)
 *   - Mock quote card rotates in on scroll
 */

export const TechTradeInBanner = () => {
  const t = useTranslations('electronicsHub.tradeIn');
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { margin: '-120px', amount: 0.25 });

  return (
    <section ref={sectionRef} className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-amber-950/85 via-yellow-900/55 to-orange-950/45 text-white shadow-lg transition-shadow hover:shadow-xl"
        >
          {/* Layer 1: base radial wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              background:
                'radial-gradient(700px 280px at 90% 0%, rgba(250,204,21,0.28), transparent 55%), radial-gradient(500px 200px at 10% 100%, rgba(245,158,11,0.22), transparent 60%)',
            }}
          />

          {/* Layer 2: shimmer sweep */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -inset-x-full"
            style={{
              background:
                'linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 0.8,
            }}
          />

          {/* Layer 3: floating orbs */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-yellow-400/25 blur-3xl"
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.08, 0.95, 1],
            }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 size-96 rounded-full bg-amber-500/22 blur-3xl"
            animate={{
              x: [0, -30, 20, 0],
              y: [0, 30, -20, 0],
              scale: [1, 1.1, 0.92, 1],
            }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative grid gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:gap-12 md:p-10">
            {/* LEFT — pitch + counted payout */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col justify-center"
            >
              <motion.div
                className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-yellow-100 backdrop-blur-sm"
                animate={{ rotate: [0, -1.5, 1.5, -1.5, 0] }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: 'easeInOut',
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-300 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-300" />
                </span>
                {t('sponsored')}
              </motion.div>

              {/* Headline payout — counts up + glows */}
              <div className="font-calSans relative flex items-baseline gap-2 font-extrabold leading-none tracking-tight text-white">
                <span className="text-[22px] font-semibold text-white/80 md:text-[26px]">
                  {t('upTo')}
                </span>
                <motion.span
                  className="inline-block text-[#facc15] text-[64px] md:text-[88px]"
                  animate={{
                    scale: [1, 1.04, 1],
                    textShadow: [
                      '0 0 0px rgba(250,204,21,0)',
                      '0 0 40px rgba(250,204,21,0.85)',
                      '0 0 0px rgba(250,204,21,0)',
                    ],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <AnimatedAED from={0} to={1800} inView={inView} />
                </motion.span>
              </div>

              <p className="mt-3 max-w-md text-[14px] text-white/80 md:text-[15px]">
                {t('pitch')}
              </p>

              {/* 3 pillars — stagger in */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: <Zap size={14} strokeWidth={2} />, label: t('pillar1') },
                  {
                    icon: <ShieldCheck size={14} strokeWidth={2} />,
                    label: t('pillar2'),
                  },
                  { icon: <Truck size={14} strokeWidth={2} />, label: t('pillar3') },
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

            {/* RIGHT — quick-quote mock card */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotateY: 6 }}
              animate={inView ? { opacity: 1, y: 0, rotateY: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.25,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="relative flex flex-col justify-center rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm md:p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  {t('calcEyebrow')}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                  <Calculator size={10} />
                  {t('calcTag')}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label={t('fieldDevice')} value="iPhone 15 Pro" />
                <Field label={t('fieldStorage')} value="256 GB" />
                <Field label={t('fieldCondition')} value={t('conditionLikeNew')} />
                <Field
                  label={t('fieldBattery')}
                  value="92%"
                  accent="text-[#facc15]"
                />
              </div>

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/55">
                    {t('estimate')}
                  </p>
                  <div className="font-calSans text-[26px] font-extrabold leading-none tracking-tight text-white">
                    <AnimatedAED from={0} to={1800} inView={inView} />
                  </div>
                </div>
                <motion.a
                  href="#"
                  className="group/btn relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-semibold text-amber-950 transition hover:bg-white/90"
                  animate={{
                    boxShadow: [
                      '0 0 0px 0px rgba(255,255,255,0)',
                      '0 0 0px 6px rgba(255,255,255,0.18)',
                      '0 0 0px 0px rgba(255,255,255,0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {t('cta')}
                  <ArrowRight
                    size={12}
                    className="transition-transform duration-300 group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5"
                  />
                </motion.a>
              </div>
              <p className="mt-3 text-[9.5px] text-white/45">
                {t('disclosure')}{' '}
                <span className="font-medium text-white/70">Dealo Cash</span> ·{' '}
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
    <p
      className={
        'mt-0.5 text-[13px] font-semibold tabular-nums ' +
        (accent ?? 'text-white')
      }
    >
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
      onUpdate: v => setValue(v),
    });
    return () => controls.stop();
  }, [from, to, inView]);

  return (
    <span className="tabular-nums">
      AED {Math.round(value).toLocaleString('en-US')}
    </span>
  );
};

export default TechTradeInBanner;
