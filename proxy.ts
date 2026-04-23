import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';
import {
  refreshSession,
  isProtectedPath,
  isAdminPath,
} from '@/lib/supabase/middleware-auth';

/**
 * Next.js proxy — runs on every request at the edge.
 *
 * File name was `middleware.ts` pre-Next-16; the convention was renamed
 * to `proxy.ts` in Next 16 to better reflect what this file does (it
 * sits between the client and the app, like a proxy — it doesn't sit
 * IN the middle of the app). Behavior is unchanged.
 *
 * Responsibilities:
 * 1. Locale detection + routing (next-intl)
 * 2. Country header injection (for future GCC expansion)
 * 3. Supabase session refresh (keeps cookie alive on long-lived tabs)
 * 4. Protected-route gating (under (app) route group)
 * 5. Admin-path auth gate (is_admin check lives in /admin/layout.tsx)
 */

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // 1. Locale routing
  const response = intlMiddleware(request);

  // 2. Country header
  const pathnameMatch = request.nextUrl.pathname.match(/^\/(kw|sa|ae|bh|qa|om)\//i);
  const country = pathnameMatch?.[1]?.toUpperCase() ?? 'KW';
  response.headers.set('x-country-code', country);

  // 3. Session refresh (user is null if not signed in)
  const { user } = await refreshSession(request, response);

  // 4. Auth gate — protected or admin paths require a session.
  //    Admin paths additionally require is_admin = true, enforced in
  //    /admin/layout.tsx (not here) to avoid DB queries at the edge.
  const pathname = request.nextUrl.pathname;
  const needsAuth = isProtectedPath(pathname) || isAdminPath(pathname);
  if (needsAuth && !user) {
    const localeMatch = pathname.match(/^\/(ar|en)(?:\/|$)/);
    const locale = localeMatch?.[1] ?? 'ar';
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/signin`;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Match all paths except:
  // - API routes (/api/*)
  // - Static files (/_next/*, /favicon.ico, etc.)
  // - Files with extensions (.png, .svg, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
