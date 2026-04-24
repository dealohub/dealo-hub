import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
import TechTradeInBanner from '@/components/shadcnblocks/tech-trade-in-banner';
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

  // Chain product queries so each section shows DIFFERENT items even
  // when inventory is thin: featured runs first, activity excludes the
  // featured IDs, and the full grid excludes both. Counts run in
  // parallel since they touch a different table.
  const [featured, counts] = await Promise.all([
    getFeaturedElectronics({ locale: params.locale, limit: 6 }),
    getElectronicsSubCatCounts(),
  ]);
  const featuredIds = featured.map(f => f.id);
  const activity = await getRecentElectronicsActivity({
    locale: params.locale,
    limit: 12,
    excludeIds: featuredIds,
  });
  const usedIds = [...featuredIds, ...activity.map(a => a.id)];
  const grid = await getElectronicsForGrid({
    locale: params.locale,
    limit: 24,
    excludeIds: usedIds,
  });

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

        <TechTradeInBanner />

        {activity.length > 0 && <ElectronicsLiveFeed items={activity} />}

        <TechTrustStrip />

        {grid.length > 0 && (
          <section className="border-b border-foreground/10 bg-background py-10 md:py-14">
            <div className="mx-auto max-w-7xl px-6">
              <header className="mb-5 flex items-end justify-between gap-4">
                <h2 className="font-calSans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {t('gridTitle')}
                </h2>
                <Link
                  href={`/${params.locale}/categories/electronics`}
                  className="shrink-0 text-xs font-medium text-primary transition hover:underline"
                >
                  {t('viewAll')}
                </Link>
              </header>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map(card => (
                  <ListingCardElectronics key={card.id} card={card} locale={params.locale} />
                ))}
              </div>
            </div>
          </section>
        )}

        <ElectronicsArticlesStrip />
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
