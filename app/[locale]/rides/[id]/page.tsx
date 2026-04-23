import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { getRideById, getSimilarRides } from '@/lib/rides/queries';
import RideDetailHeader from '@/components/shadcnblocks/ride-detail-header';
import RideDetailGallery from '@/components/shadcnblocks/ride-detail-gallery';
import RideDetailPurchasePanel from '@/components/shadcnblocks/ride-detail-purchase-panel';
import RideDetailKeyInfo from '@/components/shadcnblocks/ride-detail-key-info';
import RideDetailDescription from '@/components/shadcnblocks/ride-detail-description';
import RideDetailFeatures from '@/components/shadcnblocks/ride-detail-features';
import RideDetailSimilar from '@/components/shadcnblocks/ride-detail-similar';
import RideDetailMobileActionBar from '@/components/shadcnblocks/ride-detail-mobile-actionbar';

/**
 * /rides/[id] — vehicle detail page.
 *
 * The `[id]` param accepts either a numeric id or a slug (the query
 * layer regex-sniffs the input). Paths resolve on-demand and are
 * cached for 60 seconds via ISR, per Q6 locked decision — no
 * generateStaticParams.
 */

// ISR: each path is rendered on demand and cached for 60s.
export const revalidate = 60;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const listing = await getRideById(params.id, { locale: params.locale });
  if (!listing) {
    return { title: 'Dealo Hub', robots: { index: false, follow: false } };
  }
  const title = listing.title;
  const description = listing.description.slice(0, 160);
  const cover = listing.images[0]?.url;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: cover ? [cover] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function RideDetailPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; id: string }>;
  }
) {
  const params = await props.params;
  const listing = await getRideById(params.id, { locale: params.locale });
  if (!listing) notFound();

  const similar = await getSimilarRides(listing.id, 4, {
    locale: params.locale,
  });

  return (
    <>
      <EcommerceNavbar1 />
      <RideDetailHeader listing={listing} locale={params.locale} />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-6">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* Main column */}
          <div className="min-w-0 space-y-8">
            <RideDetailGallery listing={listing} />
            <RideDetailKeyInfo listing={listing} />
            <RideDetailFeatures listing={listing} />
            <RideDetailDescription listing={listing} locale={params.locale} />
            <RideDetailSimilar
              similar={similar}
              catColor={listing.catColor}
              categorySlug={listing.category.slug}
            />
          </div>

          {/* Sidebar */}
          <RideDetailPurchasePanel listing={listing} locale={params.locale} />
        </div>
      </section>

      <RideDetailMobileActionBar listing={listing} locale={params.locale} />

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
