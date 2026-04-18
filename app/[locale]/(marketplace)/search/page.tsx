import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { parseFiltersFromSearchParams } from '@/lib/browse/filters';
import { getSavedListingIdSet } from '@/lib/browse/queries';
import { searchListings } from '@/lib/search/queries';
import { DEFAULT_PAGE_SIZE } from '@/lib/browse/types';
import { FilterPanel } from '@/components/browse/FilterPanel';
import { FilterBottomSheet } from '@/components/browse/FilterBottomSheet';
import { FilterChipsBar } from '@/components/browse/FilterChipsBar';
import { SortDropdown } from '@/components/browse/SortDropdown';
import { Pagination } from '@/components/browse/Pagination';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { EmptyListings } from '@/components/listings/EmptyListings';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResultsHeader } from '@/components/search/SearchResultsHeader';
import type { Locale } from '@/i18n/routing';

interface PageProps {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'search' });
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  return {
    title: q ? t('metaTitleWithQuery', { query: q }) : t('metaTitle'),
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as Locale;
  const filters = parseFiltersFromSearchParams(searchParams);
  const t = await getTranslations({ locale, namespace: 'search' });
  const tBrowse = await getTranslations({ locale, namespace: 'browse' });
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';

  const supabase = createClient();
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_ar, name_en, sort_order')
    .eq('country_code', 'KW')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const { result, semanticUsed } = await searchListings(q, filters, locale);
  const savedIds = await getSavedListingIdSet(result.rows.map(r => r.id));
  const totalPages = Math.max(1, Math.ceil(result.total / DEFAULT_PAGE_SIZE));

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-6 max-w-2xl">
        <SearchInput initialQuery={q} variant="hero" />
      </div>

      {q ? (
        <SearchResultsHeader query={q} count={result.total} semanticUsed={semanticUsed} />
      ) : (
        <header className="mb-6">
          <h1 className="text-heading-1 font-semibold text-charcoal-ink">{t('emptyQueryTitle')}</h1>
          <p className="mt-2 text-body text-muted-steel">{t('emptyQueryHint')}</p>
        </header>
      )}

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <div className="hidden lg:block">
          <FilterPanel cities={cities ?? []} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FilterBottomSheet cities={cities ?? []} />
            <SortDropdown current={filters.sort} />
          </div>

          <FilterChipsBar />

          {result.rows.length === 0 ? (
            <EmptyListings
              title={tBrowse('empty.title')}
              description={q ? t('noResultsHint', { query: q }) : tBrowse('empty.description')}
              action={{ label: tBrowse('empty.browseAction'), href: '/categories' }}
            />
          ) : (
            <>
              <ListingGrid listings={result.rows} locale={locale} savedIds={savedIds} />
              <Pagination current={filters.page} total={totalPages} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
