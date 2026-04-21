import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight, BedDouble, Bath } from 'lucide-react';
import type { PropertyCard } from '@/lib/properties/types';
import { formatPrice } from '@/lib/format';
import PropertyVerificationBadge from './property-verification-badge';

/**
 * Property detail — similar properties carousel.
 *
 * Simple responsive grid (not carousel on mobile — avoids horizontal
 * scroll discovery cost on touch). Each card carries:
 *   cover · tier badge (small) · title · bed/bath/sqm specs · price ·
 *   location.
 *
 * No "Save/Compare" inline actions — those live on the main card
 * variants used in the hub. Similar cards are wayfinding, not workflow.
 */

interface Props {
  similar: PropertyCard[];
  locale: 'ar' | 'en';
}

export default function PropertyDetailSimilar({ similar, locale }: Props) {
  const t = useTranslations('marketplace.properties.detail');

  if (similar.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">
          {t('similarTitle')}
        </h2>
        <Link
          href={`/${locale}/properties`}
          className="inline-flex items-center gap-1 text-sm text-foreground/70 transition hover:text-foreground"
        >
          {t('viewAllSimilar')}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {similar.map(card => (
          <Link
            key={card.id}
            href={`/${locale}/properties/${card.slug}`}
            className="group block overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-border hover:shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-foreground/5">
              {card.cover ? (
                <Image
                  src={card.cover}
                  alt={card.title}
                  fill
                  sizes="(min-width: 1024px) 300px, 50vw"
                  className="object-cover transition group-hover:scale-[1.03]"
                />
              ) : null}
              <div className="absolute start-2 top-2">
                <PropertyVerificationBadge
                  tier={card.verificationTier}
                  size="sm"
                  hideIfUnverified
                />
              </div>
            </div>

            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {card.title}
              </h3>

              {/* Spec row */}
              <div className="flex items-center gap-2 text-[11px] text-foreground/60">
                {card.bedrooms != null && (
                  <span className="inline-flex items-center gap-1">
                    <BedDouble size={11} />
                    {card.bedrooms}
                  </span>
                )}
                {card.bathrooms != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bath size={11} />
                    {card.bathrooms}
                  </span>
                )}
                {card.areaSqm != null && (
                  <span>
                    {card.areaSqm.toLocaleString('en-US')} {t('keyInfoSqmShort')}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(card.priceMinorUnits, card.currencyCode, locale)}
                </span>
                {(card.areaName || card.cityName) && (
                  <span className="truncate text-[11px] text-foreground/50">
                    {[card.areaName, card.cityName]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
