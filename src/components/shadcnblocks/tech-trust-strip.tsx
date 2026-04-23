'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function TechTrustStrip() {
  const t = useTranslations('electronicsHub');

  const pillars = [
    { title: t('trust.catalog.title'), body: t('trust.catalog.body') },
    { title: t('trust.imei.title'), body: t('trust.imei.body') },
    { title: t('trust.battery.title'), body: t('trust.battery.body') },
    { title: t('trust.provenance.title'), body: t('trust.provenance.body') },
  ];

  return (
    <section className="border-y border-border/40 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          className="mb-8 grid gap-8 md:mb-10 md:grid-cols-2 md:gap-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Why Dealo
            </div>
            <h2 className="font-calSans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              {t('trustTitle')}
            </h2>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-[15px] leading-relaxed text-foreground/50">
              {t('trustSubline')}
            </p>
            <p className="mt-4 text-[11px] leading-loose tracking-wide text-foreground/25">
              Verified independently · Updated quarterly
            </p>
          </div>
        </motion.div>

        <div className="divide-y divide-border/25">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                duration: 0.4,
                delay: 0.04 + i * 0.07,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="group -mx-3 flex items-start gap-6 rounded-xl px-3 py-5 transition-colors duration-300 hover:bg-foreground/[0.02] sm:gap-10 sm:py-6"
            >
              <span
                aria-hidden
                className="w-16 shrink-0 select-none font-calSans text-[52px] font-bold leading-none tabular-nums text-foreground/[0.08] transition-colors duration-500 group-hover:text-primary/25 sm:w-24 sm:text-[68px]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 pt-2">
                <h3 className="font-calSans text-[17px] font-semibold tracking-tight text-foreground sm:text-[19px]">
                  {p.title}
                </h3>
                <p
                  className="mt-2 text-[13px] leading-relaxed text-foreground/50"
                  style={{ maxWidth: '58ch' }}
                >
                  {p.body}
                </p>
              </div>

              <div className="shrink-0 self-center translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:-translate-x-1 rtl:group-hover:translate-x-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground/30 rtl:rotate-180"
                  aria-hidden
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
