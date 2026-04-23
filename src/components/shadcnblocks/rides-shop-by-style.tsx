'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * RidesShopByStyle — horizontal row of circular-vehicle-image chips.
 * Mirrors Autotrader's "Shop Vehicles by Style" + KBB's motorcycle
 * row. Designed as navigation aid, not filters — tapping a style
 * scrolls to grid with that style preset.
 */

interface StyleChip {
  key: string;
  label: string;
  image: string;
  emoji: string;   // fallback + small accent
  tint: string;    // gradient color for empty-state
  count: number;
}

// Verified Unsplash photo IDs. Every tile also has an emoji + tinted
// gradient fallback so the circle is NEVER empty even if a URL 404s.
const STYLES: StyleChip[] = [
  { key: 'sedan',     label: 'sedan',     count: 1248, emoji: '🚗', tint: '#3b82f6', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=80' },
  { key: 'suv',       label: 'suv',       count: 2140, emoji: '🚙', tint: '#0ea5e9', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop&q=80' },
  { key: 'pickup',    label: 'pickup',    count: 680,  emoji: '🛻', tint: '#f59e0b', image: 'https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=600&auto=format&fit=crop&q=80' },
  { key: 'coupe',     label: 'coupe',     count: 412,  emoji: '🏎️', tint: '#ef4444', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80' },
  { key: 'hatchback', label: 'hatchback', count: 355,  emoji: '🚕', tint: '#eab308', image: 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=600&auto=format&fit=crop&q=80' },
  { key: 'bike',      label: 'bike',      count: 290,  emoji: '🏍️', tint: '#dc2626', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80' },
  { key: 'boat',      label: 'boat',      count: 98,   emoji: '🛥️', tint: '#0891b2', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&auto=format&fit=crop&q=80' },
  { key: 'camper',    label: 'camper',    count: 76,   emoji: '🚐', tint: '#059669', image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&auto=format&fit=crop&q=80' },
];

export const RidesShopByStyle = () => {
  const t = useTranslations('marketplace.rides.style');

  return (
    <section className="relative w-full border-y border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              {t('eyebrow')}
            </p>
            <h2 className="mt-1 font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
              {t('title')}
            </h2>
          </div>
          <a
            href="#"
            className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-foreground/60 transition hover:text-foreground md:inline-flex"
          >
            {t('viewAll')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Horizontal scrolling chip row on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-8">
          {STYLES.map((style, i) => (
            <StyleTile key={style.key} style={style} index={i} label={t(`tiles.${style.key}`)} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StyleTile = ({
  style,
  index,
  label,
}: {
  style: StyleChip;
  index: number;
  label: string;
}) => (
  <motion.a
    href="#"
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 0.61, 0.36, 1] }}
    whileHover={{ y: -3 }}
    className="group flex shrink-0 flex-col items-center"
  >
    {/* Circular image with ring — emoji+gradient fallback sits behind
        the <img> so even if the photo 404s, the circle is never empty. */}
    <div
      className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-full border border-foreground/10 shadow-sm transition-all duration-300 group-hover:border-foreground/30 group-hover:shadow-md md:w-full md:max-w-[128px]"
      style={{
        backgroundImage: `radial-gradient(circle at 30% 30%, ${style.tint}40, ${style.tint}15 60%, ${style.tint}08)`,
      }}
    >
      {/* Fallback layer — always rendered, <img> covers it when it loads */}
      <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl">
        <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}>{style.emoji}</span>
      </div>
      <img
        src={style.image}
        alt={label}
        className="relative size-full object-cover transition-transform duration-500 group-hover:scale-[1.1]"
        loading={index <= 1 ? 'eager' : 'lazy'}
        onError={(e) => {
          // Hide the broken <img> so the emoji+gradient fallback shows
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>

    <div className="mt-3 text-center">
      <p className="text-[13px] font-semibold tracking-tight text-foreground">{label}</p>
      <p className="text-[10px] text-foreground/45 tabular-nums">
        {style.count.toLocaleString('en-US')}
      </p>
    </div>
  </motion.a>
);

export default RidesShopByStyle;
