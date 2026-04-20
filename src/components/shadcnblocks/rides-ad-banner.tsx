'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * RidesAdBanner — full-width sponsored slot inserted between content
 * tiers. Clearly labeled "Sponsored", high-contrast CTA, generous
 * whitespace. Designed to feel native but never to deceive.
 */

export const RidesAdBanner = () => {
  const t = useTranslations('marketplace.rides.ad');

  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <article className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-[#0b1a3a] via-[#1e2a5a] to-[#2a1c5a] text-white shadow-lg transition-shadow hover:shadow-xl">
          {/* Decorative pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(600px 240px at 85% 0%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(500px 200px at 15% 100%, rgba(255,150,50,0.18), transparent 60%)',
            }}
          />

          <div className="relative grid gap-8 p-6 md:grid-cols-[1.5fr_1fr] md:gap-12 md:p-10">
            {/* Left: copy */}
            <div className="flex flex-col justify-center">
              <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
                {t('sponsored')}
              </div>

              <h3 className="font-calSans text-[28px] font-extrabold leading-tight tracking-tight md:text-[36px]">
                {t('title')}
              </h3>
              <p className="mt-2 max-w-lg text-[14px] text-white/70 md:text-[15px]">
                {t('subtitle')}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="#"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[12px] font-semibold text-[#0b1a3a] transition hover:bg-white/90"
                >
                  {t('cta')}
                  <ArrowRight size={12} className="rtl:rotate-180" />
                </a>
                <a
                  href="#"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-5 text-[12px] font-semibold text-white transition hover:bg-white/10"
                >
                  {t('secondaryCta')}
                </a>
              </div>

              <p className="mt-4 text-[10.5px] text-white/45">
                {t('disclosure')} <span className="font-medium text-white/65">Dealo Pro</span>
              </p>
            </div>

            {/* Right: stat card */}
            <div className="relative flex flex-col justify-center rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm md:p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {t('statEyebrow')}
              </div>
              <div className="mt-3 font-calSans text-[56px] font-extrabold leading-none tracking-tight text-white md:text-[72px]">
                3<span className="text-[#facc15]">×</span>
              </div>
              <div className="mt-2 text-[14px] font-medium text-white/80">
                {t('statLabel')}
              </div>
              <div className="mt-4 h-px w-full bg-white/10" />
              <ul className="mt-4 space-y-2 text-[12px] text-white/70">
                <li className="flex items-center gap-2">
                  <BulletDot />
                  {t('bullet1')}
                </li>
                <li className="flex items-center gap-2">
                  <BulletDot />
                  {t('bullet2')}
                </li>
                <li className="flex items-center gap-2">
                  <BulletDot />
                  {t('bullet3')}
                </li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

const BulletDot = () => (
  <span className="inline-block size-1.5 rounded-full bg-[#facc15]" />
);

export default RidesAdBanner;
