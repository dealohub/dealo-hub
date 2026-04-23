import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import ServiceDetailHeader from '@/components/shadcnblocks/service-detail-header';
import ServiceDetailProviderCard from '@/components/shadcnblocks/service-detail-provider-card';
import ServiceDetailReviews from '@/components/shadcnblocks/service-detail-reviews';
import ServiceDetailPurchasePanel from '@/components/shadcnblocks/service-detail-purchase-panel';
import ServiceDetailSimilar from '@/components/shadcnblocks/service-detail-similar';
import { getServiceBySlug, getSimilarServices } from '@/lib/services/queries';

/**
 * /services/[slug] — Phase 8a service detail page.
 *
 * Composition mirrors /tech/[slug] depth:
 *
 *   Navbar
 *   Header (breadcrumb + task + tier + title + provider meta)
 *
 *   ┌─────────────────────────────┬──────────────┐
 *   │ Description                 │              │
 *   │ Provider card (P2 + P9)     │ Purchase     │
 *   │ Reviews (P5)                │ panel        │
 *   │                             │ (sticky)     │
 *   └─────────────────────────────┴──────────────┘
 *
 *   Similar strip (same task_type, full width)
 *   Footer
 *
 * ISR revalidate=60.
 */

export const revalidate = 60;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const listing = await getServiceBySlug(params.slug, { locale: params.locale });
  if (!listing) return { title: 'Dealo Hub', robots: { index: false, follow: false } };
  const description = listing.description.slice(0, 160);
  return {
    title: `${listing.title} · Dealo Hub`,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: listing.title,
      description,
    },
  };
}

export default async function ServiceDetailPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations('servicesDetail');
  const listing = await getServiceBySlug(params.slug, { locale: params.locale });
  if (!listing) notFound();

  const similar = await getSimilarServices(
    listing.id,
    listing.fields.task_type,
    4,
    { locale: params.locale },
  );

  return (
    <>
      <EcommerceNavbar1 />

      <ServiceDetailHeader listing={listing} locale={params.locale} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* ── Left column ── */}
          <div className="space-y-6">
            {/* Description */}
            <section className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                {t('aboutTitle')}
              </h2>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/80">
                {listing.description}
              </p>
            </section>

            <ServiceDetailProviderCard listing={listing} locale={params.locale} />

            <ServiceDetailReviews
              providerId={listing.provider.profileId}
              locale={params.locale}
            />
          </div>

          {/* ── Right column ── */}
          <ServiceDetailPurchasePanel listing={listing} locale={params.locale} />
        </div>

        <ServiceDetailSimilar services={similar} locale={params.locale} />
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
