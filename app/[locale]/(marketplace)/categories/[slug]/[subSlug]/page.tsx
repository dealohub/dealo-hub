import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getCategoryBySlug, getSubCategoryBySlug } from '@/lib/categories';
import { parseFiltersFromSearchParams } from '@/lib/browse/filters';
import { getFilteredListings, getSavedListingIdSet } from '@/lib/browse/queries';
import { DEFAULT_PAGE_SIZE } from '@/lib/browse/types';
import { CategoryHero } from '@/components/browse/CategoryHero';
import { SubCategoryTabs } from '@/components/browse/SubCategoryTabs';
import { FilterPanel } from '@/components/browse/FilterPanel';
import { FilterBottomSheet } from '@/components/browse/FilterBottomSheet';
import { FilterChipsBar } from '@/components/browse/FilterChipsBar';
import { SortDropdown } from '@/components/browse/SortDropdown';
import { Pagination } from '@/components/browse/Pagination';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { EmptyListings } from '@/components/listings/EmptyListings';
import type { Locale } from '@/i18n/routing';

interface PageProps {
  params: { locale: string; slug: string; subSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parent = getCategoryBySlug(params.slug);
  const subMatch = getSubCategoryBySlug(params.subSlug);
  const sub = subMatch && subMatch.parent.slug === params.slug ? subMatch.sub : undefined;
  if (!parent || !sub) return {};
  const name = params.locale === 'ar' ? sub.nameAr : sub.nameEn;
  const t = await getTranslations({ locale: params.locale, namespace: 'browse.category' });
  return {
    title: t('metaTitle', { name }),
    description: t('metaDescription', { name }),
  };
}

export default async function SubCategoryPage({ params, searchParams }: PageProps) {
  const parent = getCategoryBySlug(params.slug);
  const subMatch = getSubCategoryBySlug(params.subSlug);
  const sub = subMatch && subMatch.parent.slug === params.slug ? subMatch.sub : undefined;
  if (!parent || !sub) notFound();

  const locale = (params.locale === 'en' ? 'en' : 'ar') as Locale;
  const filters = parseFiltersFromSearchParams(searchParams);
  const t = await getTranslations({ locale, namespace: 'browse' });

  const supabase = createClient();

  const [{ data: parentRow }, { data: subRow }, { data: cities }] = await Promise.all([
    supabase.from('categories').select('id, slug').eq('slug', params.slug).maybeSingle(),
    supabase.from('categories').select('id, slug').eq('slug', params.subSlug).maybeSingle(),
    supabase
      .from('cities')
      .select('id, name_ar, name_en, sort_order')
      .eq('country_code', 'KW')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (!parentRow || !subRow) notFound();

  const { rows, total } = await getFilteredListings(filters, {
    locale,
    categoryId: parentRow.id,
    subcategoryId: subRow.id,
  });
  const savedIds = await getSavedListingIdSet(rows.map(r => r.id));

  const subCategories = parent.subCategories.map(s => ({
    slug: s.slug,
    name_ar: s.nameAr,
    name_en: s.nameEn,
  }));

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return (
    <>
      <CategoryHero
        nameAr={sub.nameAr}
        nameEn={sub.nameEn}
        count={total}
        breadcrumb={{ nameAr: parent.nameAr, nameEn: parent.nameEn, slug: parent.slug }}
      />
      <SubCategoryTabs
        parentSlug={parent.slug}
        subCategories={subCategories}
        activeSubSlug={sub.slug}
      />

      <div className="container py-8 grid lg:grid-cols-[280px_1fr] gap-8">
        <div className="hidden lg:block">
          <FilterPanel cities={cities ?? []} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FilterBottomSheet cities={cities ?? []} />
            <SortDropdown current={filters.sort} />
          </div>

          <FilterChipsBar />

          {rows.length === 0 ? (
            <EmptyListings
              title={t('empty.title')}
              description={t('empty.description')}
              action={{
                label: t('empty.clearAction'),
                href: `/categories/${parent.slug}/${sub.slug}`,
              }}
            />
          ) : (
            <>
              <ListingGrid listings={rows} locale={locale} savedIds={savedIds} />
              <Pagination current={filters.page} total={totalPages} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
