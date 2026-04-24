'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Scale, Shield, Sofa, CalendarClock, BadgeCheck } from 'lucide-react';

/**
 * Properties hub — trust manifesto.
 *
 * Compact horizontal trust strip mirroring the TechTrustStrip pattern:
 * small inline header + 5-col icon-pillar grid. Each pillar is one of
 * Kuwait's structural property differentiators (Law 74, anti-bias
 * filters, diwaniya structure, chalet booking, inspected tier).
 */
export default function PropertiesTrustStrip() {
  const t = useTranslations('marketplace.properties.hub.trustStrip');

  const pillars = [
    { icon: Scale, title: t('pillar1Title'), body: t('pillar1Body') },
    { icon: Shield, title: t('pillar2Title'), body: t('pillar2Body') },
    { icon: Sofa, title: t('pillar3Title'), body: t('pillar3Body') },
    { icon: CalendarClock, title: t('pillar4Title'), body: t('pillar4Body') },
    { icon: BadgeCheck, title: t('pillar5Title'), body: t('pillar5Body') },
  ];

  return (
    <section className="border-y border-foreground/10 bg-foreground/[0.02] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* Compact inline header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-6 md:mb-8"
        >
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              Why Dealo
            </div>
            <h2 className="font-calSans text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              {t('title')}
            </h2>
          </div>
          <p className="max-w-md text-[12px] leading-relaxed text-foreground/45 sm:text-end sm:text-[13px]">
            {t('subline')}
          </p>
        </motion.div>

        {/* 5-col icon-pillar strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                duration: 0.35,
                delay: 0.05 + i * 0.05,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="group flex items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.025] p-3.5 transition-colors duration-300 hover:border-foreground/25 hover:bg-foreground/[0.045]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                <Icon size={16} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold leading-tight tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/50">
                  {body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
