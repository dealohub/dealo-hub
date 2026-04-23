'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Props {
  counts: Record<string, number>;
  locale: 'ar' | 'en';
}

interface TypeTile {
  slug: string;
  emoji: string;
  tint: string;
  image: string;
}

const TYPE_TILES: TypeTile[] = [
  {
    slug: 'home_cleaning_one_off',
    emoji: '🧹',
    tint: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'home_cleaning_recurring',
    emoji: '✨',
    tint: '#06b6d4',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'handyman_ikea_assembly',
    emoji: '🪛',
    tint: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'handyman_tv_mount',
    emoji: '📺',
    tint: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4d9c3?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'handyman_shelf_hang',
    emoji: '🔧',
    tint: '#84cc16',
    image: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'handyman_furniture_move',
    emoji: '📦',
    tint: '#f97316',
    image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'handyman_basic_painting',
    emoji: '🖌️',
    tint: '#ec4899',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80',
  },
  {
    slug: 'handyman_other',
    emoji: '🔨',
    tint: '#78716c',
    image: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=600&auto=format&fit=crop&q=80',
  },
];

export default function ServicesBrowseByType({ counts, locale }: Props) {
  const t = useTranslations('servicesHub');

  return (
    <section className="relative w-full border-y border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              {t('typesEyebrow')}
            </p>
            <h2 className="mt-1 font-calSans text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
              {t('typesSectionTitle')}
            </h2>
          </div>
          <Link
            href={`/${locale}/services`}
            className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-foreground/60 transition hover:text-foreground md:inline-flex"
          >
            {t('typesViewAll')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-8">
          {TYPE_TILES.map((tile, i) => {
            const count = counts[tile.slug] ?? 0;
            const label = t(`types.${tile.slug}` as any);
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
      href={`/${locale}/services?task=${tile.slug}`}
      className="group flex shrink-0 flex-col items-center"
    >
      <div
        className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-full border border-foreground/10 shadow-sm transition-all duration-300 group-hover:border-foreground/30 group-hover:shadow-md md:w-full md:max-w-[110px]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, ${tile.tint}40, ${tile.tint}15 60%, ${tile.tint}08)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl">
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
      <div className="mt-2.5 text-center">
        <p className="text-[12px] font-semibold tracking-tight text-foreground leading-tight">{label}</p>
        <p className="text-[10px] text-foreground/45 tabular-nums">
          {count > 0 ? count.toLocaleString('en-US') : '—'}
        </p>
      </div>
    </Link>
  </motion.div>
);
