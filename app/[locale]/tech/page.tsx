import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Package } from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import ListingCardElectronics from '@/components/shadcnblocks/listing-card-electronics';
import ElectronicsLiveFeed from '@/components/shadcnblocks/electronics-live-feed';
import ElectronicsArticlesStrip from '@/components/shadcnblocks/electronics-articles-strip';
import TechHeroSplit from '@/components/shadcnblocks/tech-hero-split';
import TechBrowseByType from '@/components/shadcnblocks/tech-browse-by-type';
import TechTrustStrip from '@/components/shadcnblocks/tech-trust-strip';
import {
  getFeaturedElectronics,
  getElectronicsForGrid,
  getElectronicsSubCatCounts,
  getRecentElectronicsActivity,
} from '@/lib/electronics/queries';
import type { ElectronicsCategoryKey } from '@/lib/electronics/types';

export const revalidate = 60;

const SUB_CATS: ElectronicsCategoryKey[] = [
  'phones-tablets',
  'laptops-computers',
  'tvs-audio',
  'gaming',
  'smart-watches',
  'cameras',
];

export async function generateMetadata(
  props: { params: Promise<{ locale: 'ar' | 'en' }> }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'electronicsHub' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function ElectronicsHubPage(
  props: { params: Promise<{ locale: 'ar' | 'en' }> }
) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'electronicsHub' });

  const [featured, grid, counts, activity] = await Promise.all([
    getFeaturedElectronics({ locale: params.locale, limit: 6 }),
    getElectronicsForGrid({ locale: params.locale, limit: 24 }),
    getElectronicsSubCatCounts(),
    getRecentElectronicsActivity({ locale: params.locale, limit: 12 }),
  ]);

  const totalLive = SUB_CATS.reduce((sum, k) => sum + counts[k], 0);
  const inspectedCount = featured.filter(
    c => c.verificationTier === 'dealo_inspected',
  ).length;

  return (
    <>
      <EcommerceNavbar1 />

      <main id="main-content">
        <TechHeroSplit
          totalLive={totalLive}
          inspectedCount={inspectedCount}
          featuredCard={featured[0] ?? null}
          locale={params.locale}
        />

        <TechBrowseByType counts={counts} locale={params.locale} />

        {featured.length > 0 && (
          <section className="border-b border-foreground/10 bg-background py-10 md:py-14">
            <div className="mx-auto max-w-7xl px-6">
              <header className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-calSans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {t('featuredTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/60">{t('featuredSubline')}</p>
                </div>
              </header>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((card, i) => (
                  <ListingCardElectronics
                    key={card.id}
                    card={card}
                    locale={params.locale}
                    priority={i < 3}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {activity.length > 0 && <ElectronicsLiveFeed items={activity} />}

        <TechTrustStrip />

        <section className="border-b border-foreground/10 bg-background py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-6">
            <header className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-calSans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {t('gridTitle')}
              </h2>
              {grid.length > 0 && (
                <Link
                  href={`/${params.locale}/categories/electronics`}
                  className="shrink-0 text-xs font-medium text-primary transition hover:underline"
                >
                  {t('viewAll')}
                </Link>
              )}
            </header>
            {grid.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/15 py-14 text-center">
                <Package size={32} className="text-foreground/30" />
                <p className="font-semibold text-foreground">{t('emptyTitle')}</p>
                <p className="text-sm text-foreground/60">{t('emptyBody')}</p>
                <Link
                  href={`/${params.locale}/sell/category`}
                  className="mt-1 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                >
                  {t('emptyCta')}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map(card => (
                  <ListingCardElectronics key={card.id} card={card} locale={params.locale} />
                ))}
              </div>
            )}
          </div>
        </section>

        <ElectronicsArticlesStrip />
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
