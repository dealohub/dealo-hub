'use client';

import { motion } from 'framer-motion';

/**
 * CategoryCoasters — experimental horizontal row of 6 large circular
 * category entries. Visual metaphor inspired by portfolio "coaster"
 * grids; functional role: make the category taxonomy immediately
 * visible on the landing page instead of hiding it in the nav mega-menu.
 *
 * To disable: remove the <CategoryCoasters /> usage in app/[locale]/page.tsx.
 * No other file references this component.
 */

type Ribbon = 'HOT' | 'NEW' | null;

interface Coaster {
  id: string;
  label: string;
  sublabel: string;
  count: string;
  color: string;
  accent: string; // slightly brighter shade for the gradient
  ribbon: Ribbon;
}

const COASTERS: Coaster[] = [
  { id: 'motors',     label: 'Motors',      sublabel: 'Cars & bikes',          count: '4,218', color: '#ef4444', accent: '#f87171', ribbon: 'HOT' },
  { id: 'property',   label: 'Property',    sublabel: 'Rent & sale',           count: '2,847', color: '#3b82f6', accent: '#60a5fa', ribbon: null },
  { id: 'jobs',       label: 'Jobs',        sublabel: 'Roles across the Gulf', count: '1,520', color: '#10b981', accent: '#34d399', ribbon: 'NEW' },
  { id: 'classifieds',label: 'Classifieds', sublabel: 'Electronics & more',    count: '6,092', color: '#a855f7', accent: '#c084fc', ribbon: null },
  { id: 'furniture',  label: 'Furniture',   sublabel: 'Home & garden',         count: '1,134', color: '#f59e0b', accent: '#fbbf24', ribbon: null },
  { id: 'mobiles',    label: 'Mobiles',     sublabel: 'Phones & tablets',      count: '2,366', color: '#14b8a6', accent: '#2dd4bf', ribbon: null },
];

export const CategoryCoasters = () => {
  return (
    <section className="relative w-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        {/* Heading — centered */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
            <span className="h-px w-6 bg-foreground/20" />
            Browse by category
            <span className="h-px w-6 bg-foreground/20" />
          </div>
          <h2 className="font-calSans text-3xl font-semibold tracking-tight text-foreground md:text-[34px]">
            Every vertical, one tap away
          </h2>
          <a
            href="#"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60 transition hover:text-foreground"
          >
            All categories
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Coaster row — scroll on mobile, grid on desktop */}
        <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-6">
          {COASTERS.map((c, i) => (
            <CoasterTile key={c.id} coaster={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CoasterTile = ({ coaster, index }: { coaster: Coaster; index: number }) => {
  return (
    <motion.a
      href="#"
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative flex shrink-0 flex-col items-center"
    >
      {/* Outer colored ring — the "coaster" */}
      <div
        className="relative aspect-square w-40 shrink-0 rounded-full p-[4px] shadow-lg transition-shadow duration-500 group-hover:shadow-xl md:w-full md:max-w-[180px]"
        style={{
          background: `linear-gradient(135deg, ${coaster.color}, ${coaster.accent})`,
          boxShadow: `0 8px 24px -8px ${coaster.color}40`,
        }}
      >
        {/* Inner light disc */}
        <div className="relative flex size-full flex-col items-center justify-center rounded-full bg-background/95 backdrop-blur-sm transition-colors duration-300 group-hover:bg-background">
          {/* Dot texture overlay — subtle */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-[0.06]"
            style={{
              background:
                'radial-gradient(circle, currentColor 1px, transparent 1px) 0 0/8px 8px',
            }}
          />

          {/* Label */}
          <div className="text-center">
            <div
              className="font-calSans text-2xl font-semibold tracking-tight"
              style={{ color: coaster.color }}
            >
              {coaster.label}
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              {coaster.sublabel}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-0.5 text-[11px] font-semibold text-foreground/75">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: coaster.color }}
              />
              <span className="tabular-nums">{coaster.count}</span>
              <span className="font-normal text-foreground/50">listings</span>
            </div>
          </div>
        </div>

        {/* Corner ribbon */}
        {coaster.ribbon && (
          <span
            className={
              'absolute top-3 end-0 translate-x-1/3 rounded-s-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md rtl:start-0 rtl:end-auto rtl:-translate-x-1/3 ' +
              (coaster.ribbon === 'HOT' ? 'bg-[#e30613]' : 'bg-emerald-500')
            }
          >
            {coaster.ribbon}
          </span>
        )}
      </div>

      {/* External nudge affordance */}
      <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/50 transition-colors duration-300 group-hover:text-foreground">
        <span>Explore</span>
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
    </motion.a>
  );
};

export default CategoryCoasters;
