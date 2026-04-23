import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { SiteHeader } from '@/components/site-header';
import { AdminHeader } from '@/components/admin/admin-header';
import { ListingsTable } from '@/components/admin/listings-table';
import LocaleToggle from '@/components/locale-toggle';
import { getAdminContext } from '@/lib/admin/admin-context';
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
 * Phase 9c: now owns its own shell. The parent layout is shell-less (so the
 * `/admin` dashboard can host the self-contained `dashboard9` block), which
 * means the moderation routes bring their own `AdminShell` —
 * `SidebarProvider` + dashboard-01 `AppSidebar` + `SidebarInset` — directly.
 *
 * Shell data (auth + profile + persisted sidebar cookie) comes from the
 * same `getAdminContext` the layout's auth gate uses; React's `cache()`
 * deduplicates the Supabase round-trips for us.
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

  const [pageResult, counts, { sidebarUser, defaultOpen }] = await Promise.all([
    getListingsPage({ tab, q, page }),
    getListingStatusCounts(),
    getAdminContext({ locale, pathname: '/admin/listings' }),
  ]);

  return (
    <AdminShell defaultOpen={defaultOpen} user={sidebarUser}>
      <SiteHeader title={t('listings.title')} />
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
      <LocaleToggle />
    </AdminShell>
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
