'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type FeatureKey = 'verification' | 'image' | 'scam' | 'semantic';

const FEATURE_KEYS: FeatureKey[] = ['verification', 'image', 'scam', 'semantic'];

export const AIProtectionStrip = () => {
  const t = useTranslations('marketplace.ai');

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20 xl:gap-28">

          {/* Left: bold statement */}
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e30613] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#e30613]" />
              </span>
              {t('eyebrow')}
            </div>

            <h2 className="font-calSans text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-[52px] lg:leading-[1.06]">
              {t('headline')}
            </h2>

            <p className="mt-5 max-w-[22rem] text-[15px] leading-relaxed text-foreground/75">
              {t('subline')}
            </p>

            <p className="mt-10 text-[11px] leading-loose text-foreground/55">
              {t('reassurance')}
            </p>
          </motion.div>

          {/* Right: numbered feature list */}
          <div className="flex flex-col justify-center divide-y divide-foreground/15">
            {FEATURE_KEYS.map((key, i) => (
              <FeatureRow key={key} featureKey={key} index={i} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

const FeatureRow = ({
  featureKey,
  index,
}: {
  featureKey: FeatureKey;
  index: number;
}) => {
  const t = useTranslations('marketplace.ai');
  const num = String(index + 1).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.4,
        delay: 0.08 + index * 0.07,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      className="group flex gap-5 py-6 first:pt-0 last:pb-0"
    >
      {/* Index number */}
      <span
        aria-hidden
        className="mt-0.5 shrink-0 font-mono text-[11px] font-bold tabular-nums tracking-[0.12em] text-foreground/55 transition-colors duration-300 group-hover:text-[#e30613]"
      >
        {num}
      </span>

      {/* Text */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {t(`features.${featureKey}.title`)}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/75">
          {t(`features.${featureKey}.desc`)}
        </p>
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/55 transition-colors duration-300 group-hover:text-foreground/85">
          <span>{t('learnMore')}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default AIProtectionStrip;
