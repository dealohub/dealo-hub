import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth / email-link callback handler.
 *
 * Supabase sends confirm/reset/oauth flows here with `?code=...`. We exchange
 * the code for a session and redirect to the requested destination (or /).
 *
 * URL shape: /{locale}/auth-callback?code=XYZ&next=/my-listings
 */
export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const locale = params.locale === 'en' ? 'en' : 'ar';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Preserve locale prefix on the redirect target.
      const target = next.startsWith('/') ? `/${locale}${next}` : `/${locale}`;
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/signin?error=callback_failed`);
}
