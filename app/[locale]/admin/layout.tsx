import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';
import { getAdminBadges } from '@/lib/admin/queries';
import { buildAdminNavGroups, type AdminUser } from '@/data/admin-sidebar';
import { AdminShell } from '@/components/admin/admin-shell';

/**
 * Admin layout — shared chrome for every `/admin/*` route.
 *
 * Responsibilities:
 *   1. Guard: reject non-admins at the earliest render boundary. The
 *      `requireAdmin` helper redirects to signin for unauthed users and
 *      404s for authed-but-not-admin users (to avoid leaking /admin's
 *      existence to random signed-in people).
 *   2. Hydrate: fetch sidebar badge counts + the current admin's display
 *      name / email / avatar in parallel, once per request.
 *   3. Render: hand everything to the `AdminShell` client component,
 *      which wires SidebarProvider + the persistent sidebar cookie.
 *
 * The `robots: noindex` metadata is belt-and-braces — middleware already
 * gates the routes, but any reverse-proxy misconfiguration would still
 * tell search engines to stay away.
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

  // Guard first — if this throws (redirect or notFound), nothing else runs.
  const { userId } = await requireAdmin({ locale, pathname: '/admin' });

  // Hydrate shell data in parallel. Profile fetch is a SELECT on the admin's
  // own row which always passes RLS, so no extra permissions check needed.
  const supabase = await createClient();
  const [profileResult, badges, t] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, handle, avatar_url')
      .eq('id', userId)
      .single(),
    getAdminBadges(),
    getTranslations({ locale, namespace: 'admin' }),
  ]);

  const { data: profile } = profileResult;
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const user: AdminUser = {
    id: userId,
    displayName:
      profile?.display_name ??
      profile?.handle ??
      authUser?.email?.split('@')[0] ??
      'Admin',
    email: authUser?.email ?? '',
    avatarUrl: profile?.avatar_url ?? null,
  };

  const navGroups = buildAdminNavGroups(locale, t, badges);

  // Read the persistent sidebar state so the first render matches the user's
  // last preference (no flash from default → collapsed).
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = sidebarCookie !== 'false';

  return (
    <AdminShell
      locale={locale}
      navGroups={navGroups}
      user={user}
      defaultOpen={defaultOpen}
    >
      {props.children}
    </AdminShell>
  );
}
