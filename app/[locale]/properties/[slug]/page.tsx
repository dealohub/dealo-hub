import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { getPropertyBySlug, getSimilarProperties } from '@/lib/properties/queries';

import PropertyDetailHeader from '@/components/shadcnblocks/property-detail-header';
import PropertyDetailGallery from '@/components/shadcnblocks/property-detail-gallery';
import PropertyDetailKeyInfo from '@/components/shadcnblocks/property-detail-key-info';
import PropertyDetailAmenities from '@/components/shadcnblocks/property-detail-amenities';
import PropertyDetailDescription from '@/components/shadcnblocks/property-detail-description';
import PropertyDetailChaletBooking from '@/components/shadcnblocks/property-detail-chalet-booking';
import PropertyDetailPaymentPlan from '@/components/shadcnblocks/property-detail-payment-plan';
import PropertyDetailSimilar from '@/components/shadcnblocks/property-detail-similar';
import PropertyDetailPurchasePanel from '@/components/shadcnblocks/property-detail-purchase-panel';
import PropertyDetailMobileActionBar from '@/components/shadcnblocks/property-detail-mobile-actionbar';
import PropertyOwnershipBanner from '@/components/shadcnblocks/property-ownership-banner';

/**
 * /properties/[slug] — property detail page.
 *
 * ISR with 60s revalidate, matching the rides-detail pattern. The
 * `[slug]` segment accepts either the real slug or a numeric id —
 * the query layer regex-sniffs and branches.
 *
 * Composition order (top → bottom):
 *   navbar
 *   header (centered hero with verification + featured/hot badges)
 *   ownership-eligibility banner (sale listings, Law 74)
 *   2-column grid:
 *     main (gallery, key-info, amenities, chalet-booking, payment-plan,
 *           description, similar)
 *     sidebar (purchase-panel — sticky on lg+)
 *   mobile-action-bar (fixed bottom on <lg)
 *   footer
 *
 * Render-time branching:
 *   chalet-booking    → only when propertyType='chalet' AND rent sub-cat
 *   payment-plan      → only when completionStatus='off_plan' AND sale
 *   ownership-banner  → only when deriveOwnershipEligibility returns non-null
 *
 * All three branches are silent on non-matching listings (components
 * return null). No render-time if-else in the page shell.
 */

export const revalidate = 60;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const listing = await getPropertyBySlug(params.slug, { locale: params.locale });
  if (!listing) return { title: 'Dealo Hub' };
  const locale = params.locale;
  const title = `${listing.title} · Dealo Hub`;
  const description = listing.description.slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.images[0]?.url ? [listing.images[0].url] : [],
      locale: locale === 'ar' ? 'ar_KW' : 'en_US',
    },
    alternates: {
      canonical: `/${locale}/properties/${listing.slug}`,
      languages: {
        'ar-KW': `/ar/properties/${listing.slug}`,
        'en-US': `/en/properties/${listing.slug}`,
      },
    },
  };
}

export default async function PropertyDetailPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
) {
  const params = await props.params;
  const listing = await getPropertyBySlug(params.slug, { locale: params.locale });
  if (!listing) notFound();

  const similar = await getSimilarProperties(listing.id, 4, {
    locale: params.locale,
  });

  return (
    <>
      <EcommerceNavbar1 />
      <PropertyDetailHeader listing={listing} locale={params.locale} />

      <section className="mx-auto max-w-7xl px-6 pb-28 pt-6 lg:pb-16">
        {/* Ownership eligibility banner (sale listings only) */}
        <div className="mb-6">
          <PropertyOwnershipBanner
            subCat={listing.subCat}
            zoningType={listing.fields.zoningType}
          />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* Main column */}
          <div className="min-w-0 space-y-8">
            <PropertyDetailGallery listing={listing} />
            <PropertyDetailKeyInfo listing={listing} />
            <PropertyDetailAmenities listing={listing} />
            <PropertyDetailChaletBooking listing={listing} />
            <PropertyDetailPaymentPlan listing={listing} />
            <PropertyDetailDescription listing={listing} locale={params.locale} />
            <PropertyDetailSimilar similar={similar} locale={params.locale} />
          </div>

          {/* Sidebar */}
          <PropertyDetailPurchasePanel listing={listing} locale={params.locale} />
        </div>
      </section>

      <PropertyDetailMobileActionBar listing={listing} locale={params.locale} />

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
