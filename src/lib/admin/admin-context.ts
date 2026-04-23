import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

/**
 * Shared data the admin shell needs on every `/admin/*` page:
 *   - auth gate (delegated to `requireAdmin`)
 *   - display identity for the sidebar's `NavUser` footer
 *   - persisted `sidebar_state` cookie so SSR matches the user's last
 *     collapsed/expanded preference without a hydration flash
 *
 * Wrapped in React's `cache()` so when both the layout guard and a page's
 * shell invoke it within the same request, the Supabase auth + profile
 * queries run exactly once. This is what lets us move the `AdminShell`
 * wrapper out of the layout (so `/admin` can render a standalone dashboard
 * shell) without paying for duplicate round-trips on every route change.
 */
export type AdminContext = {
  userId: string;
  sidebarUser: {
    name: string;
    email: string;
    avatar: string;
  };
  defaultOpen: boolean;
};

export const getAdminContext = cache(
  async (opts: {
    locale: 'ar' | 'en';
    pathname: string;
  }): Promise<AdminContext> => {
    const { userId } = await requireAdmin(opts);

    const supabase = await createClient();
    const [profileResult, authResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url')
        .eq('id', userId)
        .single(),
      supabase.auth.getUser(),
    ]);

    const { data: profile } = profileResult;
    const {
      data: { user: authUser },
    } = authResult;

    const displayName =
      profile?.display_name ??
      profile?.handle ??
      authUser?.email?.split('@')[0] ??
      'Admin';

    const sidebarUser = {
      name: displayName,
      email: authUser?.email ?? '',
      // Radix Avatar is happy with an empty string — AvatarFallback covers
      // the 404 case using the user's initials.
      avatar: profile?.avatar_url ?? '',
    };

    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get('sidebar_state')?.value;
    const defaultOpen = sidebarCookie !== 'false';

    return { userId, sidebarUser, defaultOpen };
  },
);
