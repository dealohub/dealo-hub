import type { Metadata } from 'next';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import {
  getFeaturedProperties,
  getPropertiesForGrid,
  getPropertyTypeCounts,
} from '@/lib/properties/queries';

import PropertiesHeroSplit from '@/components/shadcnblocks/properties-hero-split';
import PropertiesBrowseByType from '@/components/shadcnblocks/properties-browse-by-type';
import PropertiesFeaturedPremium from '@/components/shadcnblocks/properties-featured-premium';
import PropertiesTrustStrip from '@/components/shadcnblocks/properties-trust-strip';
import PropertiesMainGrid from '@/components/shadcnblocks/properties-main-grid';
import PropertiesArticlesStrip from '@/components/shadcnblocks/properties-articles-strip';

/**
 * /properties — property vertical hub.
 *
 * ISR revalidate=60. Pre-fetches three query results in parallel:
 *   - featuredCards (up to 6, featured=true)
 *   - allCards (up to 24, drives the main grid + all client filters)
 *   - typeCounts (live per-property_type counts → "browse by type")
 *
 * Page composition top → bottom:
 *   navbar → hero (with live stats) → browse-by-type tiles →
 *   featured-premium row → trust-strip (5-pillar doctrine) →
 *   main-grid (filter chips + sort) → articles-strip → footer
 *
 * All grid filtering runs client-side on `allCards` (no re-fetch per
 * chip click). Server-side pagination is Phase 5+ when the seed count
 * grows beyond ~50.
 */

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const title =
    params.locale === 'ar'
      ? 'عقارات الكويت — كل منزل موثّق · ديلو هَب'
      : 'Kuwait Properties — Every home verified · Dealo Hub';
  const description =
    params.locale === 'ar'
      ? 'أول منصة عقارات محميّة بالذكاء الاصطناعي في الكويت. وضوح قانون 74، حجز الشاليه، ديوانية منظّمة.'
      : "Kuwait's first AI-protected property marketplace. Law 74 clarity, chalet booking primitives, structured diwaniya.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${params.locale}/properties`,
      languages: {
        'ar-KW': `/ar/properties`,
        'en-US': `/en/properties`,
      },
    },
  };
}

export default async function PropertiesHubPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const [featured, allCards, typeCounts] = await Promise.all([
    getFeaturedProperties({ limit: 6, locale: params.locale }),
    getPropertiesForGrid({ limit: 24, locale: params.locale }),
    getPropertyTypeCounts(),
  ]);

  const inspectedCount = allCards.filter(
    c => c.verificationTier === 'dealo_inspected',
  ).length;
  const chaletCount = allCards.filter(c => c.propertyType === 'chalet').length;

  return (
    <>
      <EcommerceNavbar1 />

      <PropertiesHeroSplit
        totalListings={allCards.length}
        inspectedCount={inspectedCount}
        chaletCount={chaletCount}
      />

      <PropertiesBrowseByType counts={typeCounts} locale={params.locale} />

      <PropertiesFeaturedPremium featured={featured} locale={params.locale} />

      <PropertiesTrustStrip />

      <PropertiesMainGrid allCards={allCards} locale={params.locale} />

      <PropertiesArticlesStrip />

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
