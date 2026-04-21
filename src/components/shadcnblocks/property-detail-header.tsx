import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home, Flame, Sparkle } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';
import PropertyVerificationBadge from './property-verification-badge';

/**
 * Property detail — header (centered hero).
 *
 * Structure (mirrors ride-detail-header but property-centric):
 *   breadcrumb → badges strip → h1 → meta row (type · specs · city) →
 *   seller mini-card (right side on lg+)
 *
 * Doctrine surface:
 *   - Verification tier badge (P1/P6) prominent on every listing
 *   - Featured / hot flags as accent chips
 *   - Sub-cat label wired to taxonomy rather than a free-text category
 *
 * Kept deliberately compact vs rides-detail-header (355 lines) —
 * properties don't need fuel/mileage/VIN/trim-level chips in the hero.
 */

interface Props {
  listing: PropertyDetail;
  locale: 'ar' | 'en';
}

function propertyTypeKey(value: string): string {
  return (
    {
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
    }[value] ?? 'typeApartment'
  );
}

export default function PropertyDetailHeader({ listing, locale }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;

  const typeLabel = t(propertyTypeKey(f.propertyType) as any);

  return (
    <header className="border-b border-border/50 bg-gradient-to-b from-background to-background/50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-1.5 text-xs text-foreground/60"
        >
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Home size={12} />
            {t('crumbHome')}
          </Link>
          <ChevronRight size={12} className="opacity-50 rtl:rotate-180" />
          <Link
            href={`/${locale}/properties`}
            className="hover:text-foreground"
          >
            {t('crumbProperties')}
          </Link>
          <ChevronRight size={12} className="opacity-50 rtl:rotate-180" />
          <span className="text-foreground/80">{typeLabel}</span>
        </nav>

        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PropertyVerificationBadge
            tier={listing.verificationTier}
            verifiedAt={listing.verifiedAt}
            verifiedBy={listing.verifiedBy}
            size="lg"
          />
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-sm font-medium text-primary ring-1 ring-primary/30">
              <Sparkle size={14} strokeWidth={2.25} />
              Featured
            </span>
          )}
          {listing.isHot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-sm font-medium text-rose-500 ring-1 ring-rose-500/30">
              <Flame size={14} strokeWidth={2.25} />
              Hot
            </span>
          )}
          <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-sm font-medium text-foreground/70 ring-1 ring-foreground/10">
            {typeLabel}
          </span>
        </div>

        {/* H1 + meta */}
        <div className="max-w-4xl">
          <h1 className="text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-[40px] md:leading-[1.1]">
            {listing.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/70">
            {f.bedrooms != null && (
              <span>
                <strong className="font-semibold text-foreground">
                  {f.bedrooms}
                </strong>{' '}
                {f.bedrooms === 1 ? t('keyInfoBedShort') : t('keyInfoBedShortPlural')}
              </span>
            )}
            {f.bathrooms != null && f.bedrooms != null && (
              <span className="text-foreground/30">·</span>
            )}
            {f.bathrooms != null && (
              <span>
                <strong className="font-semibold text-foreground">
                  {f.bathrooms}
                </strong>{' '}
                {f.bathrooms === 1 ? t('keyInfoBathShort') : t('keyInfoBathShortPlural')}
              </span>
            )}
            <span className="text-foreground/30">·</span>
            <span>
              <strong className="font-semibold text-foreground">
                {f.areaSqm.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-US', {
                  numberingSystem: 'latn',
                })}
              </strong>{' '}
              {t('keyInfoSqmShort')}
            </span>
            {listing.cityName && (
              <>
                <span className="text-foreground/30">·</span>
                <span>{listing.cityName}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/60">
          <span>
            <strong className="text-foreground/80">
              {listing.viewCount.toLocaleString('en-US')}
            </strong>{' '}
            {t('statViews')}
          </span>
          <span>
            <strong className="text-foreground/80">
              {listing.saveCount.toLocaleString('en-US')}
            </strong>{' '}
            {t('statSaves')}
          </span>
          <span>
            <strong className="text-foreground/80">
              {listing.chatInitiationCount.toLocaleString('en-US')}
            </strong>{' '}
            {t('statInquiries')}
          </span>
          <span>
            <strong className="text-foreground/80">{listing.images.length}</strong>{' '}
            {t('statPhotos')}
          </span>
          <span className="ms-auto">
            {t('statListingId')}{' '}
            <strong className="text-foreground/80">#{listing.id}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
