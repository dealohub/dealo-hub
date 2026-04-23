import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminHeader } from '@/components/admin/admin-header';
import { ListingsTable } from '@/components/admin/listings-table';
import {
  LISTING_STATUS_TABS,
  getListingStatusCounts,
  getListingsPage,
  type ListingStatusTab,
} from '@/lib/admin/queries';

export async function generateMetadata(props: {
  params: Promise<{ locale: 'ar' | 'en' }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: `${t('listings.title')} · Dealo`,
    robots: { index: false, follow: false },
  };
}

interface SearchParams {
  tab?: string;
  q?: string;
  page?: string;
}

/**
 * Admin listings moderation page.
 *
 * URL-driven state: `?tab=held&q=toyota&page=2` — so refreshing the page
 * and deep-linking both work. The client table mutates these query params
 * via `router.replace()` when the admin filters or paginates.
 */
export default async function AdminListingsPage(props: {
  params: Promise<{ locale: 'ar' | 'en' }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'admin' });

  const tab = parseTab(searchParams.tab);
  const q = (searchParams.q ?? '').trim();
  const page = parsePage(searchParams.page);

  const [pageResult, counts] = await Promise.all([
    getListingsPage({ tab, q, page }),
    getListingStatusCounts(),
  ]);

  return (
    <>
      <AdminHeader
        title={t('listings.title')}
        subtitle={t('listings.subtitle')}
      />
      <main className="flex-1 p-4 sm:p-6">
        <ListingsTable
          locale={locale}
          initialTab={tab}
          initialQuery={q}
          initialPage={page}
          pageResult={pageResult}
          counts={counts}
        />
      </main>
    </>
  );
}

function parseTab(raw: string | undefined): ListingStatusTab {
  if (!raw) return 'held';
  return (LISTING_STATUS_TABS as readonly string[]).includes(raw)
    ? (raw as ListingStatusTab)
    : 'held';
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
