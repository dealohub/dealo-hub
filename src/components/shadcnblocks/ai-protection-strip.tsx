'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, ScanSearch, Eye, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * AIProtectionStrip — showcases the AI-protection layer that is
 * Dealo Hub's core differentiator from generic classifieds. Sits
 * between the brands marquee and the live feed so visitors see
 * "why you can trust this marketplace" before they see the listings.
 */

interface Feature {
  icon: LucideIcon;
  key: 'verification' | 'image' | 'scam' | 'semantic';
  tint: string;
}

const FEATURES: Feature[] = [
  { icon: ShieldCheck, key: 'verification', tint: '#10b981' },
  { icon: Eye,         key: 'image',        tint: '#3b82f6' },
  { icon: ScanSearch,  key: 'scam',         tint: '#ef4444' },
  { icon: Sparkles,    key: 'semantic',     tint: '#a855f7' },
];

export const AIProtectionStrip = () => {
  const t = useTranslations('marketplace.ai');

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a855f7] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
            </span>
            {t('eyebrow')}
          </div>
          <h2 className="font-calSans text-3xl font-semibold tracking-tight text-foreground md:text-[38px]">
            {t('headline')}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-foreground/55 md:text-base">
            {t('subline')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.key} feature={f} index={i} />
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-foreground/40">
          {t('reassurance')}
        </p>
      </div>
    </section>
  );
};

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
  const t = useTranslations('marketplace.ai');
  const Icon = feature.icon;
  const title = t(`features.${feature.key}.title`);
  const desc = t(`features.${feature.key}.desc`);
  return (
    <motion.article
      initial={{ y: 16, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition-colors duration-300 hover:border-foreground/20 hover:bg-foreground/[0.04]"
    >
      {/* Tint wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${feature.tint}18, transparent 60%)`,
        }}
      />

      {/* Icon medallion */}
      <div
        className="relative mb-4 inline-flex size-11 items-center justify-center rounded-xl border"
        style={{
          borderColor: `${feature.tint}40`,
          background: `${feature.tint}14`,
          color: feature.tint,
        }}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>

      <h3 className="relative mb-1.5 text-[15px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="relative text-[13px] leading-relaxed text-foreground/60">{desc}</p>

      {/* Arrow affordance */}
      <div
        className="relative mt-4 inline-flex items-center gap-1 text-[11px] font-medium transition-colors duration-300"
        style={{ color: `${feature.tint}` }}
      >
        <span className="opacity-70 group-hover:opacity-100">{t('learnMore')}</span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </motion.article>
  );
};

export default AIProtectionStrip;
