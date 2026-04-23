import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-only admin gate for /admin/* layouts and pages.
 *
 * Flow:
 *  1. If no session          → redirect to /{locale}/signin?next={pathname}
 *  2. If session but not admin → 404 (do NOT leak /admin's existence)
 *  3. Else                     → return { user, isAdmin: true }
 *
 * The is_admin check uses the SECURITY DEFINER RPC `public.is_admin()`
 * (defined in migration 0041) rather than a direct SELECT on profiles.
 * This avoids RLS edge cases and keeps the check consistent with the
 * database's own view of "who is an admin".
 *
 * Usage:
 *   // app/[locale]/admin/layout.tsx
 *   export default async function AdminLayout({ params, children }) {
 *     const { locale } = params;
 *     await requireAdmin({ locale, pathname: '/admin' });
 *     return <AdminShell>{children}</AdminShell>;
 *   }
 *
 * Security model:
 *   - Middleware already enforces session (returns 302 to signin for
 *     unauthed requests on /admin/*), but we re-check here because
 *     middleware is the outermost layer and we don't want to couple
 *     security correctness to it.
 *   - notFound() renders the app's 404 page — indistinguishable from a
 *     non-existent path. This is by design.
 */
export async function requireAdmin(opts: {
  locale: 'ar' | 'en';
  pathname: string;
}): Promise<{ userId: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${opts.locale}/signin?next=${encodeURIComponent(opts.pathname)}`);
  }

  // RPC returns boolean. Types may not include it until db:types is re-run
  // after migration 0041 ships to the live database, so cast narrowly.
  const { data, error } = await supabase.rpc('is_admin' as never);

  if (error) {
    // Fail closed — treat any RPC error as "not admin" rather than leaking
    // system details or granting access on a transient failure.
    notFound();
  }

  if (data !== true) {
    notFound();
  }

  return { userId: user.id };
}
