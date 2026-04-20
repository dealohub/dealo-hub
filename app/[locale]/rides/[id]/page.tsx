import { notFound } from 'next/navigation';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { RIDE_LISTINGS } from '@/components/shadcnblocks/rides-data';
import RideDetailHeader from '@/components/shadcnblocks/ride-detail-header';
import RideDetailGallery from '@/components/shadcnblocks/ride-detail-gallery';
import RideDetailPurchasePanel from '@/components/shadcnblocks/ride-detail-purchase-panel';
import RideDetailKeyInfo from '@/components/shadcnblocks/ride-detail-key-info';
import RideDetailDescription from '@/components/shadcnblocks/ride-detail-description';
import RideDetailFeatures from '@/components/shadcnblocks/ride-detail-features';
import RideDetailSimilar from '@/components/shadcnblocks/ride-detail-similar';
import RideDetailMobileActionBar from '@/components/shadcnblocks/ride-detail-mobile-actionbar';

/**
 * /rides/[id] — individual vehicle detail page.
 *
 * Layout:
 *   Header (full width)
 *   Grid 2-col (from top):
 *     Main col:   Gallery → KeyInfo → (future sections 5-8)
 *     Sidebar:    Sticky purchase panel (price, CTAs, finance)
 *   Mobile: sidebar stacks, sticky bottom action bar appears
 */
export default async function RideDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const listing = RIDE_LISTINGS.find((l) => String(l.id) === params.id);
  if (!listing) notFound();

  return (
    <>
      <EcommerceNavbar1 />
      <RideDetailHeader listing={listing} />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-6">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* Main column */}
          <div className="min-w-0 space-y-8">
            <RideDetailGallery listing={listing} />
            <RideDetailKeyInfo listing={listing} />
            <RideDetailFeatures listing={listing} />
            <RideDetailDescription listing={listing} />
            <RideDetailSimilar listing={listing} />
          </div>

          {/* Sidebar */}
          <RideDetailPurchasePanel listing={listing} />
        </div>
      </section>

      <RideDetailMobileActionBar listing={listing} />

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}

export function generateStaticParams() {
  return RIDE_LISTINGS.map((l) => ({ id: String(l.id) }));
}
