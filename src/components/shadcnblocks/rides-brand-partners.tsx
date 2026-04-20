'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * RidesBrandPartners — horizontal auto-scrolling marquee of OEM / dealer
 * partners. Professional animation treatment matching the NBK Finance
 * banner: radial wash + shimmer sweep + continuous marquee + per-logo
 * hover lift. Logos fade + colorize on hover instead of being dead-grey
 * by default.
 */

// Text-based brands so rendering never depends on a flaky CDN.
// Each brand gets its own display treatment so the row reads like a
// real editorial "as seen in" credit strip, not a generic logo grid.
// `font` picks the typography style; `accent` tints the hover glow.
type BrandStyle = {
  name: string;
  font: string;          // CSS font-family stack
  tracking?: string;     // letter-spacing
  weight?: string;       // font-weight
  italic?: boolean;
  accent: string;        // hex color used in hover glow only
};

const BRANDS: BrandStyle[] = [
  { name: 'TOYOTA',      font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.2em',  weight: '900',                accent: '#EB0A1E' },
  { name: 'BMW',         font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.1em',  weight: '900',                accent: '#1C69D4' },
  { name: 'Mercedes-Benz',font: "'Georgia', serif",                    tracking: '0.12em', weight: '700',                accent: '#00ADEF' },
  { name: 'AUDI',        font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.5em',  weight: '500',                accent: '#BB0A30' },
  { name: 'PORSCHE',     font: "'Georgia', serif",                    tracking: '0.3em',  weight: '700',                accent: '#D5001C' },
  { name: 'Land Rover',  font: "'Georgia', serif",                    tracking: '0.08em', weight: '600', italic: true,  accent: '#005A2B' },
  { name: 'LEXUS',       font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.35em', weight: '400',                accent: '#1A1A1A' },
  { name: 'Ferrari',     font: "'Georgia', serif",                    tracking: '0.02em', weight: '700', italic: true,  accent: '#FF2800' },
  { name: 'DUCATI',      font: "'Impact', 'Arial Black', sans-serif", tracking: '0.08em', weight: '900', italic: true,  accent: '#CC0000' },
  { name: 'TESLA',       font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.45em', weight: '400',                accent: '#CC0000' },
  { name: 'Volkswagen',  font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.04em', weight: '700',                accent: '#001E50' },
  { name: 'NISSAN',      font: "'Helvetica Neue', Arial, sans-serif", tracking: '0.25em', weight: '700',                accent: '#C3002F' },
];

// Double the list so the marquee loops seamlessly — when the first copy
// finishes translating by -50%, the second copy is exactly in position.
const MARQUEE = [...BRANDS, ...BRANDS];

export const RidesBrandPartners = () => {
  const t = useTranslations('marketplace.rides.brands');

  return (
    <section className="relative w-full overflow-hidden border-y border-foreground/10 bg-gradient-to-b from-foreground/[0.04] via-foreground/[0.02] to-foreground/[0.04]">
      {/* Layer 1 — soft radial wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(600px 160px at 85% 50%, rgba(201,168,106,0.10), transparent 60%), radial-gradient(500px 140px at 15% 50%, rgba(59,130,246,0.08), transparent 60%)',
        }}
      />

      {/* Layer 2 — shimmer sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-full z-[1]"
        style={{
          background:
            'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-2.5">
        {/* Header */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C9A86A] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C9A86A]" />
            </span>
            <span className="h-px w-8 bg-foreground/25" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              {t('eyebrow')}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/30 bg-[#C9A86A]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#C9A86A]">
              {BRANDS.length}+ OEM
            </span>
          </div>
          <a
            href="#"
            className="group hidden items-center gap-1.5 text-[12px] font-medium text-foreground/60 transition hover:text-foreground md:inline-flex"
          >
            {t('browseAll')}
            <svg
              width="12"
              height="12"
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
          </a>
        </div>

        {/* Marquee track */}
        <div className="group/marquee relative">
          {/* Edge fades so logos dissolve into the background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 bg-gradient-to-r from-background to-transparent rtl:bg-gradient-to-l"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 bg-gradient-to-l from-background to-transparent rtl:bg-gradient-to-r"
          />

          <div className="overflow-hidden">
            <motion.div
              className="flex items-center gap-3 will-change-transform"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
              style={{ width: 'max-content' }}
            >
              {MARQUEE.map((b, i) => (
                <a
                  key={`${b.name}-${i}`}
                  href="#"
                  title={b.name}
                  className="group/logo relative flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2.5 transition-all duration-300 hover:border-foreground/10 hover:bg-foreground/[0.04]"
                  style={{ minWidth: 80 }}
                >
                  <span
                    className="text-foreground/55 transition-all duration-300 group-hover/logo:text-foreground"
                    style={{
                      fontFamily: b.font,
                      fontWeight: b.weight ?? '700',
                      fontStyle: b.italic ? 'italic' : 'normal',
                      letterSpacing: b.tracking ?? '0.1em',
                      fontSize: '11px',
                    }}
                  >
                    {b.name}
                  </span>
                  {/* Accent glow on hover — brand color */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/logo:opacity-100"
                    style={{
                      background: `radial-gradient(100px 44px at 50% 50%, ${b.accent}28, transparent 70%)`,
                    }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover/logo:w-10"
                    style={{ background: b.accent }}
                  />
                </a>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Trust strip — quick credibility signals under the marquee */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[9px] uppercase tracking-[0.15em] text-foreground/45">
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            {t('trustAuthorized') /* "Authorized distributors" */}
          </span>
          <span className="hidden h-3 w-px bg-foreground/15 md:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
            </svg>
            {t('trustWarranty') /* "Factory warranty" */}
          </span>
          <span className="hidden h-3 w-px bg-foreground/15 md:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9A86A]">
              <path d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z" />
            </svg>
            {t('trustVerified') /* "Verified dealer network" */}
          </span>
        </div>
      </div>
    </section>
  );
};

export default RidesBrandPartners;
