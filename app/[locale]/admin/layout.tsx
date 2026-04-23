import type { Metadata } from 'next';
import { getAdminContext } from '@/lib/admin/admin-context';

/**
 * Admin layout — the outer chrome for every `/admin/*` route.
 *
 * Phase 9c: the layout is deliberately **shell-less**. Each page owns its
 * own sidebar composition so the dashboard root can render the full
 * self-contained shadcnblocks `dashboard9` block (which brings its own
 * `SidebarProvider` + `AppSidebar` + header) while the moderation routes
 * continue to render inside `AdminShell` + `dashboard-01`'s sidebar.
 *
 * Responsibilities kept here:
 *   1. Defense-in-depth auth gate via `getAdminContext` (redirects
 *      non-admins — middleware already does this, but layout-level re-check
 *      means correctness isn't coupled to middleware config).
 *   2. `robots: noindex` so any proxy misconfig still tells bots to skip.
 *
 * Identity + sidebar-cookie data is still fetched here (via the cached
 * `getAdminContext`), but pages pull the same cached result when they need
 * to render the shell — no duplicate Supabase round-trips.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout(props: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const params = await props.params;
  const locale = (params.locale === 'en' ? 'en' : 'ar') as 'ar' | 'en';

  // Auth gate — if this throws (redirect or notFound), nothing else runs.
  // The context is cached per-request so pages below can reuse it without
  // triggering a second Supabase query.
  await getAdminContext({ locale, pathname: '/admin' });

  return <>{props.children}</>;
}
