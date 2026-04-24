import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Package } from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import ListingCardServices from '@/components/shadcnblocks/listing-card-services';
import ServicesHeroSplit from '@/components/shadcnblocks/services-hero-split';
import ServicesBrowseByType from '@/components/shadcnblocks/services-browse-by-type';
import ServicesTrustStrip from '@/components/shadcnblocks/services-trust-strip';
import {
  getFeaturedServices,
  getServicesForGrid,
  getServiceTaskTypeCounts,
} from '@/lib/services/queries';

export const revalidate = 60;

export async function generateMetadata(
  props: { params: Promise<{ locale: 'ar' | 'en' }> }
): Promise<Metadata> {
  const params = await props.params;
  const title =
    params.locale === 'ar'
      ? 'الخدمات المنزلية — مزوّدون موثّقون · ديلو هَب'
      : 'Home Services — Verified providers · Dealo Hub';
  const description =
    params.locale === 'ar'
      ? 'تنظيف ومهام منزلية من مزوّدين محقّقي الهوية في الكويت. أسعار شفافة، تواصل داخل Dealo فقط.'
      : 'Cleaning + handyman tasks from identity-verified providers in Kuwait. Transparent prices, chat-only contact.';
  return { title, description };
}

export default async function ServicesHubPage(
  props: { params: Promise<{ locale: 'ar' | 'en' }> }
) {
  const params = await props.params;
  const t = await getTranslations('servicesHub');
  const locale = params.locale;

  // Dedup chain: Featured first, then Grid excludes featured IDs so
  // "Top-rated providers" and "All home services" never repeat the same
  // listing. taskCounts runs in parallel — different aggregation.
  const [featured, taskCounts] = await Promise.all([
    getFeaturedServices({ locale, limit: 6 }),
    getServiceTaskTypeCounts(),
  ]);
  const grid = await getServicesForGrid({
    locale,
    limit: 24,
    excludeIds: featured.map(f => f.id),
  });

  const totalLive = Object.values(taskCounts).reduce((a, b) => a + b, 0);
  const verifiedProviders = featured.filter(
    c =>
      c.verificationTier === 'identity_verified' ||
      c.verificationTier === 'address_verified' ||
      c.verificationTier === 'dealo_inspected',
  ).length;

  return (
    <>
      <EcommerceNavbar1 />

      <main id="main-content">
        <ServicesHeroSplit
          totalLive={totalLive}
          verifiedProviders={verifiedProviders}
          featuredCard={featured[0] ?? null}
          locale={locale}
        />

        <ServicesBrowseByType counts={taskCounts} locale={locale} />

        {featured.length > 0 && (
          <section className="border-b border-foreground/10 bg-background py-10 md:py-14">
            <div className="mx-auto max-w-7xl px-6">
              <header className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-calSans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {t('featuredTitle')}
                  </h2>
                </div>
              </header>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map(card => (
                  <ListingCardServices key={card.id} card={card} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}

        <ServicesTrustStrip />

        <section className="border-b border-foreground/10 bg-background py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-6">
            <header className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-calSans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {t('gridTitle')}
              </h2>
              {grid.length > 0 && (
                <p className="text-sm text-foreground/55">
                  {grid.length} {t('gridCount')}
                </p>
              )}
            </header>
            {grid.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/15 py-14 text-center">
                <Package size={32} className="text-foreground/30" />
                <p className="text-sm text-foreground/55">{t('emptyState')}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {grid.map(card => (
                  <ListingCardServices key={card.id} card={card} locale={locale} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
