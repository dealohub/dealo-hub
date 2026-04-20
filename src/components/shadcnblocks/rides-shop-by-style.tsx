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
  count: number;
}

// Image URLs use the larger, more reliable Unsplash photo IDs that
// are known to resolve. Swap out any that 404 with replacements from
// the verified pool.
const STYLES: StyleChip[] = [
  { key: 'sedan',     label: 'sedan',     count: 1248, image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop' },
  { key: 'suv',       label: 'suv',       count: 2140, image: 'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=600&auto=format&fit=crop' },
  { key: 'pickup',    label: 'pickup',    count: 680,  image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop' },
  { key: 'coupe',     label: 'coupe',     count: 412,  image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop' },
  { key: 'hatchback', label: 'hatchback', count: 355,  image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop' },
  { key: 'bike',      label: 'bike',      count: 290,  image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop' },
  { key: 'boat',      label: 'boat',      count: 98,   image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&auto=format&fit=crop' },
  { key: 'camper',    label: 'camper',    count: 76,   image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&auto=format&fit=crop' },
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
    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 0.61, 0.36, 1] }}
    whileHover={{ y: -3 }}
    className="group flex shrink-0 flex-col items-center"
  >
    {/* Circular image with ring */}
    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-full border border-foreground/10 bg-foreground/[0.04] shadow-sm transition-all duration-300 group-hover:border-foreground/30 group-hover:shadow-md md:w-full md:max-w-[128px]">
      <img
        src={style.image}
        alt={label}
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.1]"
        loading="lazy"
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
