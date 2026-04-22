import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import {
  getElectronicsBySlug,
  getSimilarElectronics,
} from '@/lib/electronics/queries';
import ElectronicsDetailHeader from '@/components/shadcnblocks/electronics-detail-header';
import ElectronicsDetailGallery from '@/components/shadcnblocks/electronics-detail-gallery';
import ElectronicsDetailSpecsCard from '@/components/shadcnblocks/electronics-detail-specs-card';
import ElectronicsDetailTrustCard from '@/components/shadcnblocks/electronics-detail-trust-card';
import ElectronicsDetailDescription from '@/components/shadcnblocks/electronics-detail-description';
import ElectronicsDetailSimilar from '@/components/shadcnblocks/electronics-detail-similar';
import ElectronicsDetailPurchasePanel from '@/components/shadcnblocks/electronics-detail-purchase-panel';

/**
 * /tech/[slug] — electronics detail page (Phase 7 v2).
 *
 * Composition (mirrors /properties/[slug] depth — 6 components + page
 * shell instead of single-file MVP):
 *
 *   Navbar
 *   Header (breadcrumb + tier badge + grade + badal/featured/hot chips + title + meta)
 *
 *   ┌─────────────────────────────┬──────────────┐
 *   │ Gallery                     │              │
 *   │ Trust card                  │   Purchase   │
 *   │ Specs card                  │   panel      │
 *   │ Description                 │   (sticky)   │
 *   └─────────────────────────────┴──────────────┘
 *
 *   Similar strip (full width)
 *   Footer
 *
 * ISR revalidate=60.
 */

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en'; slug: string };
}): Promise<Metadata> {
  const listing = await getElectronicsBySlug(params.slug, {
    locale: params.locale,
  });
  if (!listing)
    return { title: 'Dealo Hub', robots: { index: false, follow: false } };

  const description = listing.description.slice(0, 160);
  const cover = listing.images[0]?.url;
  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: 'website',
      images: cover ? [cover] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ElectronicsDetailPage({
  params,
}: {
  params: { locale: 'ar' | 'en'; slug: string };
}) {
  const listing = await getElectronicsBySlug(params.slug, {
    locale: params.locale,
  });
  if (!listing) notFound();

  const similar = await getSimilarElectronics(listing.id, 4, {
    locale: params.locale,
  });

  return (
    <>
      <EcommerceNavbar1 />

      <ElectronicsDetailHeader listing={listing} locale={params.locale} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* ── Left column ── */}
          <div className="space-y-6">
            <ElectronicsDetailGallery listing={listing} />
            <ElectronicsDetailTrustCard listing={listing} locale={params.locale} />
            <ElectronicsDetailSpecsCard
              listing={listing}
              locale={params.locale}
            />
            <ElectronicsDetailDescription listing={listing} />
          </div>

          {/* ── Right column ── */}
          <ElectronicsDetailPurchasePanel
            listing={listing}
            locale={params.locale}
          />
        </div>

        {/* ── Similar strip (full width) ── */}
        {similar.length > 0 && (
          <div className="mt-12">
            <ElectronicsDetailSimilar
              listings={similar}
              locale={params.locale}
            />
          </div>
        )}
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
