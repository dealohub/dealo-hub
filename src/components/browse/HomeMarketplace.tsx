import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { getFeaturedListings, getFilteredListings, getSavedListingIdSet } from '@/lib/browse/queries';
import { createClient } from '@/lib/supabase/server';
import { CategoryGrid } from './CategoryGrid';
import { FeaturedSection } from './FeaturedSection';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchInput } from '@/components/search/SearchInput';
import { EMPTY_FILTERS } from '@/lib/browse/types';
import type { Locale } from '@/i18n/routing';

interface HomeMarketplaceProps {
  locale: Locale;
  displayName?: string;
}

/**
 * Authenticated home — the marketplace entry point.
 *
 * Order matches DESIGN.md Section 11: hero-search → category grid → one
 * featured strip (luxury) → recent listings.
 */
export async function HomeMarketplace({ locale, displayName }: HomeMarketplaceProps) {
  const t = await getTranslations({ locale, namespace: 'home.marketplace' });

  const supabase = createClient();
  const { data: luxuryCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'luxury')
    .is('parent_id', null)
    .maybeSingle();

  const [featuredLuxury, recent] = await Promise.all([
    getFeaturedListings({ locale, limit: 4, categoryId: luxuryCategory?.id }),
    getFilteredListings({ ...EMPTY_FILTERS, sort: 'newest' }, { locale, pageSize: 8 }),
  ]);

  const allIds = [...featuredLuxury, ...recent.rows].map(r => r.id);
  const savedIds = await getSavedListingIdSet(allIds);

  return (
    <div className="container py-8 sm:py-12 flex flex-col gap-12 sm:gap-16">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-label uppercase tracking-wider text-warm-amber-700">
            <Sparkles className="size-3.5" strokeWidth={2} />
            {t('aiSearchLabel')}
          </span>
          <h1 className="text-display font-bold text-charcoal-ink tracking-tight">
            {displayName ? t('greetingNamed', { name: displayName }) : t('greeting')}
          </h1>
          <p className="text-body-large text-muted-steel">{t('heroSubline')}</p>
        </div>
        <SearchInput variant="hero" />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-heading-1 font-semibold text-charcoal-ink">{t('categoriesTitle')}</h2>
        <CategoryGrid />
      </section>

      <FeaturedSection
        title={t('featuredLuxuryTitle')}
        listings={featuredLuxury}
        savedIds={savedIds}
        seeMoreHref="/categories/luxury"
      />

      <section className="flex flex-col gap-5">
        <h2 className="text-heading-1 font-semibold text-charcoal-ink">{t('recentTitle')}</h2>
        <ListingGrid listings={recent.rows} locale={locale} savedIds={savedIds} />
      </section>
    </div>
  );
}
