import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Properties hub — browse-by-type tiles.
 *
 * Renders only the property types that have ≥1 live listing in the DB.
 * Counts passed in from getPropertyTypeCounts(). Each tile links to
 * the grid scoped to that type.
 */

interface Props {
  counts: Record<string, number>;
  locale: 'ar' | 'en';
}

const TYPE_ORDER: Array<{ slug: string; emoji: string; key: string }> = [
  { slug: 'apartment', emoji: '🏢', key: 'typeApartment' },
  { slug: 'villa', emoji: '🏡', key: 'typeVilla' },
  { slug: 'chalet', emoji: '🏖️', key: 'typeChalet' },
  { slug: 'townhouse', emoji: '🏘️', key: 'typeTownhouse' },
  { slug: 'penthouse', emoji: '🌆', key: 'typePenthouse' },
  { slug: 'duplex', emoji: '🏚️', key: 'typeDuplex' },
  { slug: 'studio', emoji: '🛏️', key: 'typeStudio' },
  { slug: 'room', emoji: '🚪', key: 'typeRoom' },
  { slug: 'land-plot', emoji: '🗺️', key: 'typeLandPlot' },
  { slug: 'office', emoji: '🏢', key: 'typeOffice' },
  { slug: 'shop', emoji: '🏪', key: 'typeShop' },
  { slug: 'warehouse', emoji: '🏭', key: 'typeWarehouse' },
  { slug: 'floor', emoji: '🪟', key: 'typeFloor' },
  { slug: 'annex', emoji: '🏗️', key: 'typeAnnex' },
];

export default function PropertiesBrowseByType({ counts, locale }: Props) {
  const t = useTranslations('marketplace.properties.hub.types');
  const td = useTranslations('marketplace.properties.detail');

  const tiles = TYPE_ORDER.filter(type => (counts[type.slug] ?? 0) > 0);
  if (tiles.length === 0) return null;

  return (
    <section className="border-b border-border/40 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">{t('subline')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tiles.map(tile => {
            const count = counts[tile.slug] ?? 0;
            return (
              <Link
                key={tile.slug}
                href={`/${locale}/properties?type=${tile.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="text-2xl">{tile.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {td(tile.key as any)}
                  </div>
                  <div className="text-[11px] text-foreground/50">
                    {count.toLocaleString('en-US')}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
