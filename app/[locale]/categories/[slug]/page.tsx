import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCategoryBySlug } from '@/lib/browse/category-queries';
import { getFilteredListings } from '@/lib/browse/queries';
import SearchResultCard from '@/components/search/search-result-card';
import { DEFAULT_PAGE_SIZE, type SortOption } from '@/lib/browse/types';

/**
 * /categories/[slug] — per-category browse page.
 *
 * Three branches:
 *   1. Slug matches `automotive` → 308-redirect to `/rides` (the
 *      dedicated vertical hub, which already has the chip filters,
 *      featured strip, etc. — no point duplicating UI).
 *   2. Slug matches `real-estate` → 308-redirect to `/properties`.
 *   3. Slug matches `electronics` → 308-redirect to `/tech`.
 *   4. Anything else → render a generic browse grid:
 *        • Heading + live count
 *        • Sub-category chip row (links to filtered URL)
 *        • Sort selector + paginated grid via getFilteredListings
 *
 * Why redirects instead of conditional rendering: deep-links should
 * land on the canonical hub (better SEO, simpler analytics, no chance
 * of two URLs serving the same listing index).
 *
 * Filters today (kept narrow on purpose — full filter sheet is search
 * page's responsibility):
 *   • subcategory_id (from chip click)
 *   • sort (newest / price_asc / price_desc / most_saved)
 *   • page (URL ?page=N)
 *
 * ISR revalidate=60.
 */

export const revalidate = 60;

const VERTICAL_REDIRECTS: Record<string, string> = {
  automotive: 'rides',
  'real-estate': 'properties',
  electronics: 'tech',
  services: 'services',
};

const VALID_SORTS: SortOption[] = ['newest', 'price_asc', 'price_desc', 'most_saved'];

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Dealo Hub', robots: { index: false, follow: false } };

  const name = params.locale === 'ar' ? cat.nameAr : cat.nameEn;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'browse.category',
  });
  return {
    title: t('metaTitle', { name }),
    description: t('metaDescription', { name }),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoryBrowsePage(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
    searchParams: Promise<{ sub?: string; sort?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  // Vertical redirects first — keeps the canonical hub URLs.
  const verticalTarget = VERTICAL_REDIRECTS[params.slug];
  if (verticalTarget) {
    redirect(`/${params.locale}/${verticalTarget}`);
  }

  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();

  const t = await getTranslations({
    locale: params.locale,
    namespace: 'browse',
  });
  const tEmpty = await getTranslations({
    locale: params.locale,
    namespace: 'browse.empty',
  });
  const tSort = await getTranslations({
    locale: params.locale,
    namespace: 'browse.sort',
  });

  // Parse query params defensively.
  const subcategoryId =
    searchParams.sub && /^\d+$/.test(searchParams.sub)
      ? Number.parseInt(searchParams.sub, 10)
      : null;
  const sort = (VALID_SORTS as ReadonlyArray<string>).includes(searchParams.sort ?? '')
    ? (searchParams.sort as SortOption)
    : 'newest';
  const page =
    searchParams.page && /^\d+$/.test(searchParams.page)
      ? Math.max(1, Number.parseInt(searchParams.page, 10))
      : 1;

  // If a sub chip is active, scope listings to that sub-cat. Otherwise
  // fan out to all children of this parent (single category_id IN (...)).
  // We use `categoryId` for the parent itself OR a specific child via
  // `subcategoryId` only when the sub chip is set.
  const result = subcategoryId
    ? await getFilteredListings(
        { page, sort, areaIds: [], conditions: [], priceModes: [], deliveryOptions: [] },
        { locale: params.locale, categoryId: subcategoryId },
      )
    : await getAllChildListings(cat, {
        sort,
        page,
        locale: params.locale,
      });

  const name = params.locale === 'ar' ? cat.nameAr : cat.nameEn;
  const totalPages = Math.max(1, Math.ceil(result.total / DEFAULT_PAGE_SIZE));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-24 md:py-12">
      {/* Breadcrumb */}
      <nav
        className="mb-3 flex items-center gap-1.5 text-xs text-foreground/60"
        aria-label="breadcrumb"
      >
        <Link href={`/${params.locale}/`} className="hover:text-foreground">
          {t('empty.browseAction')}
        </Link>
        <span className="text-foreground/30">/</span>
        <Link
          href={`/${params.locale}/categories`}
          className="hover:text-foreground"
        >
          {t('index.title')}
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {name}
        </h1>
        <p className="text-sm text-foreground/60">
          {t('category.resultCount', { count: result.total })}
        </p>
      </header>

      {/* Sub-cat chip row */}
      {cat.subCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <Link
            href={`/${params.locale}/categories/${cat.slug}${
              sort !== 'newest' ? `?sort=${sort}` : ''
            }`}
            className={
              'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
              (subcategoryId == null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-foreground/[0.06] text-foreground/75 hover:bg-foreground/10')
            }
          >
            {t('category.resultCount', { count: result.total })}
          </Link>
          {cat.subCategories.map(sub => {
            const subName =
              params.locale === 'ar' ? sub.nameAr : sub.nameEn;
            const isActive = subcategoryId === sub.id;
            const qs = new URLSearchParams();
            qs.set('sub', String(sub.id));
            if (sort !== 'newest') qs.set('sort', sort);
            return (
              <Link
                key={sub.id}
                href={`/${params.locale}/categories/${cat.slug}?${qs.toString()}`}
                className={
                  'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                  (isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-foreground/[0.06] text-foreground/75 hover:bg-foreground/10')
                }
              >
                {subName}
              </Link>
            );
          })}
        </div>
      )}

      {/* Sort row */}
      <div className="mb-4 flex items-center justify-end gap-2 text-xs text-foreground/65">
        <span>{tSort('newest')}:</span>
        <div className="flex flex-wrap gap-1.5">
          {VALID_SORTS.map(s => {
            const qs = new URLSearchParams();
            if (subcategoryId) qs.set('sub', String(subcategoryId));
            if (s !== 'newest') qs.set('sort', s);
            const href = `/${params.locale}/categories/${cat.slug}${
              qs.toString() ? `?${qs.toString()}` : ''
            }`;
            const isActive = sort === s;
            return (
              <Link
                key={s}
                href={href}
                className={
                  'rounded-md px-2 py-1 transition ' +
                  (isActive
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-foreground/55 hover:bg-foreground/[0.06]')
                }
              >
                {tSort(s)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {result.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-foreground/[0.02] p-10 text-center">
          <h2 className="text-base font-semibold text-foreground">
            {tEmpty('title')}
          </h2>
          <p className="mt-1 text-sm text-foreground/60">{tEmpty('description')}</p>
          <Link
            href={`/${params.locale}/categories`}
            className="mt-4 inline-block rounded-full bg-foreground/[0.06] px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-foreground/10"
          >
            {tEmpty('browseAction')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map(card => (
            <SearchResultCard key={card.id} card={card} locale={params.locale} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-2 text-xs text-foreground/70"
          aria-label={t('pagination.label')}
        >
          {page > 1 && (
            <Link
              href={pageHref(params.locale, cat.slug, subcategoryId, sort, page - 1)}
              className="rounded-md bg-foreground/[0.06] px-3 py-1.5 hover:bg-foreground/10"
            >
              {t('pagination.prev')}
            </Link>
          )}
          <span className="px-2 text-foreground/55">
            {t('pagination.page', { current: page, total: totalPages })}
          </span>
          {page < totalPages && (
            <Link
              href={pageHref(params.locale, cat.slug, subcategoryId, sort, page + 1)}
              className="rounded-md bg-foreground/[0.06] px-3 py-1.5 hover:bg-foreground/10"
            >
              {t('pagination.next')}
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pageHref(
  locale: 'ar' | 'en',
  catSlug: string,
  subId: number | null,
  sort: SortOption,
  page: number,
): string {
  const qs = new URLSearchParams();
  if (subId) qs.set('sub', String(subId));
  if (sort !== 'newest') qs.set('sort', sort);
  if (page > 1) qs.set('page', String(page));
  const tail = qs.toString();
  return `/${locale}/categories/${catSlug}${tail ? `?${tail}` : ''}`;
}

/**
 * Get listings across the parent + every child sub-cat. The Supabase
 * client doesn't accept `.in()` for relational filters cleanly when
 * combined with the rest of `getFilteredListings`'s arguments, so we
 * fan out by issuing a single in-clause query of our own here.
 *
 * Reuses `getFilteredListings` for sort + pagination + RLS hygiene by
 * passing the parent + child ids through `categoryId` one at a time —
 * but to keep this MVP simple we use a direct supabase call here.
 */
async function getAllChildListings(
  cat: { id: number; subCategories: Array<{ id: number }> },
  opts: { sort: SortOption; page: number; locale: 'ar' | 'en' },
) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const ids = [cat.id, ...cat.subCategories.map(s => s.id)];
  let query = supabase
    .from('listings')
    .select(
      `id, title, price_minor_units, currency_code, price_mode, min_offer_minor_units,
       country_code, created_at, save_count, authenticity_confirmed, category_id,
       listing_images ( url, thumb_url, medium_url, position ),
       listing_videos ( id ),
       profiles:seller_id ( id, display_name, handle, avatar_url, phone_verified_at ),
       cities:city_id ( id, name_ar, name_en ),
       areas:area_id ( id, name_ar, name_en ),
       category:categories!listings_category_id_fkey ( slug, name_ar, name_en )`,
      { count: 'exact' },
    )
    .in('category_id', ids)
    .eq('status', 'live')
    .not('fraud_status', 'in', '(held,rejected)')
    .is('soft_deleted_at', null);

  switch (opts.sort) {
    case 'price_asc':
      query = query.order('price_minor_units', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_minor_units', { ascending: false });
      break;
    case 'most_saved':
      query = query.order('save_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const offset = Math.max(0, (opts.page - 1) * DEFAULT_PAGE_SIZE);
  query = query.range(offset, offset + DEFAULT_PAGE_SIZE - 1);

  const { data, count } = await query;
  if (!data) return { rows: [], total: 0 };

  // Reuse the row-mapping shape from the search card by going through
  // the existing browse mapper. Avoids a parallel mapper drift.
  const rows = (data as any[]).map(row => {
    const images = (row.listing_images ?? []).sort(
      (a: any, b: any) => a.position - b.position,
    );
    const cover = images[0];
    return {
      id: row.id as number,
      title: row.title as string,
      priceMode: row.price_mode,
      priceMinorUnits:
        typeof row.price_minor_units === 'string'
          ? BigInt(row.price_minor_units)
          : row.price_minor_units,
      currencyCode: row.currency_code,
      minOfferMinorUnits:
        row.min_offer_minor_units == null
          ? null
          : typeof row.min_offer_minor_units === 'string'
            ? BigInt(row.min_offer_minor_units)
            : row.min_offer_minor_units,
      coverUrl: cover?.medium_url ?? cover?.url ?? null,
      imageCount: images.length,
      hasVideo: (row.listing_videos?.length ?? 0) > 0,
      areaName: row.areas
        ? opts.locale === 'ar'
          ? row.areas.name_ar
          : row.areas.name_en
        : null,
      cityName: row.cities
        ? opts.locale === 'ar'
          ? row.cities.name_ar
          : row.cities.name_en
        : null,
      createdAt: row.created_at as string,
      saveCount: row.save_count as number,
      categorySlug: row.category?.slug ?? null,
      isAuthenticityConfirmed: row.authenticity_confirmed as boolean,
      seller: {
        id: row.profiles?.id ?? '',
        displayName: row.profiles?.display_name ?? '—',
        handle: row.profiles?.handle ?? null,
        avatarUrl: row.profiles?.avatar_url ?? null,
        isPhoneVerified: !!row.profiles?.phone_verified_at,
      },
    };
  });

  return { rows, total: count ?? rows.length };
}
