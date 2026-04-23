'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * Properties hub — browse-by-type circular tiles.
 *
 * Same visual pattern as RidesShopByStyle: circular photo chips in a
 * horizontal scroll (mobile) / grid (desktop). Only types with ≥1 live
 * listing are rendered. Emoji + gradient fallback ensures circles are
 * never blank if a photo 404s.
 */

interface Props {
  counts: Record<string, number>;
  locale: 'ar' | 'en';
}

interface TypeTile {
  slug: string;
  key: string;
  emoji: string;
  tint: string;
  image: string;
}

const TYPE_TILES: TypeTile[] = [
  {
    slug: 'apartment',
    key: 'typeApartment',
    emoji: '🏢',
    tint: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'villa',
    key: 'typeVilla',
    emoji: '🏡',
    tint: '#10b981',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'chalet',
    key: 'typeChalet',
    emoji: '🏖️',
    tint: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'townhouse',
    key: 'typeTownhouse',
    emoji: '🏘️',
    tint: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1592595896551-12b371d546d3?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'penthouse',
    key: 'typePenthouse',
    emoji: '🌆',
    tint: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'duplex',
    key: 'typeDuplex',
    emoji: '🏚️',
    tint: '#ec4899',
    image: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'studio',
    key: 'typeStudio',
    emoji: '🛏️',
    tint: '#06b6d4',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'office',
    key: 'typeOffice',
    emoji: '🏢',
    tint: '#64748b',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'land-plot',
    key: 'typeLandPlot',
    emoji: '🗺️',
    tint: '#84cc16',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'shop',
    key: 'typeShop',
    emoji: '🏪',
    tint: '#f97316',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'warehouse',
    key: 'typeWarehouse',
    emoji: '🏭',
    tint: '#78716c',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'room',
    key: 'typeRoom',
    emoji: '🚪',
    tint: '#a855f7',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'floor',
    key: 'typeFloor',
    emoji: '🪟',
    tint: '#14b8a6',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'annex',
    key: 'typeAnnex',
    emoji: '🏗️',
    tint: '#ef4444',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop&q=80',
  },
];

export default function PropertiesBrowseByType({ counts, locale }: Props) {
  const t = useTranslations('marketplace.properties.hub.types');
  const td = useTranslations('marketplace.properties.detail');

  const tiles = TYPE_TILES.filter(tile => (counts[tile.slug] ?? 0) > 0);
  if (tiles.length === 0) return null;

  return (
    <section className="relative w-full border-y border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              {t('eyebrow')}
            </p>
            <h2 className="mt-1 font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
              {t('title')}
            </h2>
          </div>
          <Link
            href={`/${locale}/properties`}
            className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-foreground/60 transition hover:text-foreground md:inline-flex"
          >
            {t('viewAll')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Horizontal scroll on mobile, responsive grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-7">
          {tiles.map((tile, i) => {
            const count = counts[tile.slug] ?? 0;
            const label = td(tile.key as any);
            return (
              <TypeTileItem
                key={tile.slug}
                tile={tile}
                index={i}
                label={label}
                count={count}
                locale={locale}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TypeTileItem = ({
  tile,
  index,
  label,
  count,
  locale,
}: {
  tile: TypeTile;
  index: number;
  label: string;
  count: number;
  locale: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 0.61, 0.36, 1] }}
    whileHover={{ y: -3 }}
  >
    <Link
      href={`/${locale}/properties?type=${tile.slug}`}
      className="group flex shrink-0 flex-col items-center"
    >
      {/* Circular image with emoji+gradient fallback */}
      <div
        className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-full border border-foreground/10 shadow-sm transition-all duration-300 group-hover:border-foreground/30 group-hover:shadow-md md:w-full md:max-w-[128px]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, ${tile.tint}40, ${tile.tint}15 60%, ${tile.tint}08)`,
        }}
      >
        {/* Emoji fallback — always rendered */}
        <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl">
          <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}>{tile.emoji}</span>
        </div>
        <img
          src={tile.image}
          alt={label}
          className="relative size-full object-cover transition-transform duration-500 group-hover:scale-[1.1]"
          loading={index <= 1 ? 'eager' : 'lazy'}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="mt-3 text-center">
        <p className="text-[13px] font-semibold tracking-tight text-foreground">{label}</p>
        <p className="text-[10px] text-foreground/45 tabular-nums">
          {count.toLocaleString('en-US')}
        </p>
      </div>
    </Link>
  </motion.div>
);
