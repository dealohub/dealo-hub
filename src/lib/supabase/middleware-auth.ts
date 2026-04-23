import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Middleware Supabase helper — refreshes the auth session cookie and
 * returns the user (or null) for protected-route decisions.
 *
 * Works with next-intl's composed middleware: call this AFTER next-intl has
 * produced its response, pass that response in, and we mutate its cookies.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both the request (for downstream reads) and the response.
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // getUser() triggers a refresh when the access token is near-expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

// Paths that require authentication (under (app) route group).
// Checked as substrings against the pathname, e.g., "/ar/my-listings".
// NOTE: `/profile` is NOT blanket-protected — only `/profile/edit` and `/profile/me`.
// The public viewer routes `/profile/[handle]` and `/profile/u/[uuid]` must stay open.
export const PROTECTED_PATH_SEGMENTS = [
  '/my-listings',
  '/messages',
  '/profile/edit',
  '/profile/me',
  '/saved',
  '/sell',
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_SEGMENTS.some(seg => pathname.includes(seg));
}

/**
 * Admin-only paths. Auth is enforced here at the edge (middleware); the
 * actual `is_admin = true` check is done inside /admin/layout.tsx via
 * `requireAdmin()` so we don't run DB queries in the edge runtime.
 *
 * Stricter regex than isProtectedPath — we don't want accidental substring
 * matches on user-generated paths (e.g., a listing titled "admin chair").
 * Matches: /admin, /admin/*, /ar/admin, /ar/admin/*, /en/admin, /en/admin/*
 */
const ADMIN_PATH_REGEX = /^\/(?:ar\/|en\/)?admin(?:\/|$)/;

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_REGEX.test(pathname);
}
