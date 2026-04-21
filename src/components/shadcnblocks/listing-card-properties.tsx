import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BedDouble, Bath, Ruler, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { PropertyCard } from '@/lib/properties/types';
import PropertyVerificationBadge from './property-verification-badge';

/**
 * Property card — used across featured-premium, main-grid, and
 * similar carousels. Tuned for properties:
 *
 *   - Verification tier badge (sm, visible only when >unverified)
 *   - Bed · bath · sqm row replacing rides' year · fuel · mileage
 *   - Rent-period suffix when applicable ("/mo", "/night")
 *   - Cheques pill for yearly rentals
 *   - Negotiable badge on the price
 *   - City name below price
 *
 * Design deliberately minimal — the hub is already busy enough without
 * 5 badges per card. Two badges max: verification (top-left) +
 * featured/negotiable (top-right).
 */

interface Props {
  card: PropertyCard;
  locale: 'ar' | 'en';
  priority?: boolean; // pass to Image priority for above-the-fold cards
}

export default function ListingCardProperties({ card, locale, priority }: Props) {
  const t = useTranslations('marketplace.properties.hub.card');
  const td = useTranslations('marketplace.properties.detail');

  const periodKey = card.rentPeriod
    ? ({
        daily: 'periodDaily',
        weekly: 'periodWeekly',
        monthly: 'periodMonthly',
        yearly: 'periodYearly',
      }[card.rentPeriod] as any)
    : null;

  return (
    <Link
      href={`/${locale}/properties/${card.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-border hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-foreground/5">
        {card.cover ? (
          <Image
            src={card.cover}
            alt={card.title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            priority={priority}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground/40">
            —
          </div>
        )}

        {/* Top-left: verification tier */}
        <div className="absolute start-2 top-2">
          <PropertyVerificationBadge
            tier={card.verificationTier}
            size="sm"
            hideIfUnverified
          />
        </div>

        {/* Top-right: featured OR negotiable */}
        <div className="absolute end-2 top-2 flex flex-col items-end gap-1">
          {card.isFeatured && (
            <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm backdrop-blur">
              ◆ Featured
            </span>
          )}
          {card.isPriceNegotiable && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur">
              {t('negotiable')}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2.5 p-3.5">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
          {card.title}
        </h3>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-[11px] text-foreground/60">
          {card.bedrooms != null && (
            <span className="inline-flex items-center gap-1">
              <BedDouble size={12} />
              {card.bedrooms}
            </span>
          )}
          {card.bathrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bath size={12} />
              {card.bathrooms}
            </span>
          )}
          {card.areaSqm != null && (
            <span className="inline-flex items-center gap-1">
              <Ruler size={12} />
              {card.areaSqm.toLocaleString('en-US')} {t('sqmShort')}
            </span>
          )}
          {card.chequesCount != null && (
            <span className="ms-auto rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium">
              {t('chequesN', { n: card.chequesCount })}
            </span>
          )}
        </div>

        {/* Price + city */}
        <div className="flex items-baseline justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-semibold text-foreground">
              {formatPrice(card.priceMinorUnits, card.currencyCode, locale)}
            </span>
            {periodKey && (
              <span className="text-[11px] text-foreground/50">{t(periodKey)}</span>
            )}
          </div>
        </div>

        {/* City + type */}
        <div className="flex items-center justify-between gap-2 text-[10px] text-foreground/50">
          {(card.areaName || card.cityName) ? (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin size={10} />
              {[card.areaName, card.cityName].filter(Boolean).join(' · ')}
            </span>
          ) : (
            <span />
          )}
          <span className="uppercase tracking-wide">
            {td(
              ({
                apartment: 'typeApartment',
                villa: 'typeVilla',
                townhouse: 'typeTownhouse',
                chalet: 'typeChalet',
                studio: 'typeStudio',
                duplex: 'typeDuplex',
                penthouse: 'typePenthouse',
                floor: 'typeFloor',
                annex: 'typeAnnex',
                office: 'typeOffice',
                shop: 'typeShop',
                warehouse: 'typeWarehouse',
                room: 'typeRoom',
                'land-plot': 'typeLandPlot',
              }[card.propertyType] ?? 'typeApartment') as any,
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
