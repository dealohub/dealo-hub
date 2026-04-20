'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, ScanSearch, Eye, type LucideIcon } from 'lucide-react';

/**
 * AIProtectionStrip — showcases the AI-protection layer that is
 * Dealo Hub's core differentiator from generic classifieds. Sits
 * between the brands marquee and the live feed so visitors see
 * "why you can trust this marketplace" before they see the listings.
 */

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  tint: string; // hex for the icon + accent
}

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    tint: '#10b981',
    title: 'Listing verification',
    desc: 'Every ad passes an AI first-line review, then a human spot-check before it goes live. No bots, no duplicates.',
  },
  {
    icon: Eye,
    tint: '#3b82f6',
    title: 'Image intelligence',
    desc: 'Reverse-matched against stolen-photo databases. Blurred plates, staged shots and reused stock get flagged.',
  },
  {
    icon: ScanSearch,
    tint: '#ef4444',
    title: 'Scam shield',
    desc: 'Off-platform payment asks, phishing patterns and price anomalies trigger real-time warnings in chat.',
  },
  {
    icon: Sparkles,
    tint: '#a855f7',
    title: 'Semantic search',
    desc: 'Type like you speak — "reliable family car under 80k" — our embeddings understand intent, not just keywords.',
  },
];

export const AIProtectionStrip = () => {
  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Header — matches other sections */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a855f7] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
            </span>
            AI + Human protection
          </div>
          <h2 className="font-calSans text-3xl font-semibold tracking-tight text-foreground md:text-[38px]">
            Every deal, verified.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-foreground/55 md:text-base">
            A four-layer safety net runs on every listing and every chat — so
            you spend time picking what to buy, not checking if it's real.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>

        {/* Footer: reassurance line */}
        <p className="mt-8 text-center text-[11px] text-foreground/40">
          AI outputs reviewed by humans · Human reviewers trained monthly · Protection runs on every request, not on launch day
        </p>
      </div>
    </section>
  );
};

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
  const Icon = feature.icon;
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
        {feature.title}
      </h3>
      <p className="relative text-[13px] leading-relaxed text-foreground/60">{feature.desc}</p>

      {/* Arrow affordance */}
      <div
        className="relative mt-4 inline-flex items-center gap-1 text-[11px] font-medium transition-colors duration-300"
        style={{ color: `${feature.tint}` }}
      >
        <span className="opacity-70 group-hover:opacity-100">Learn more</span>
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
