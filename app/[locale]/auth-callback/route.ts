import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * /auth-callback — Supabase email verification + OAuth handshake.
 *
 * Arrival flow:
 *   1. User signs up → Supabase sends verification email with link:
 *      https://...supabase.co/auth/v1/verify?token=...&redirect_to=
 *        https://dealo-hub.com/{locale}/auth-callback?code=...
 *   2. They click → land here with ?code= query param
 *   3. We exchange the code for a session (sets auth cookies)
 *   4. Redirect to /[locale]/
 *
 * Errors redirect to /[locale]/signin?auth_error=1 so the signin page
 * can render a friendly message. No secrets are surfaced to the URL.
 *
 * This is a route handler (not a page) because there's no UI — just
 * a session exchange + redirect.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: 'ar' | 'en' } },
): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;
  const localePrefix = `/${params.locale}`;

  if (!code) {
    return NextResponse.redirect(
      `${origin}${localePrefix}/signin?auth_error=no_code`,
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth-callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(
      `${origin}${localePrefix}/signin?auth_error=exchange_failed`,
    );
  }

  // Success — land on home (logged-in state)
  return NextResponse.redirect(`${origin}${localePrefix}/`);
}
