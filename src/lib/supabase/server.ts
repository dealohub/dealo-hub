import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (respects RLS).
 * Use in Server Components, Route Handlers, Server Actions.
 *
 * Async since Next 15 — `cookies()` now returns `Promise<ReadonlyRequestCookies>`.
 * All callers must `await createClient()`.
 *
 * Uses @supabase/ssr 0.6+ getAll/setAll cookies API (old get/set/remove is
 * deprecated). The setAll try/catch is expected: Server Components can't
 * mutate cookies, so we swallow that error — session refresh happens in
 * middleware instead (see middleware-auth.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Called from Server Component — cookies are read-only there.
            // Session refresh happens in middleware, so this is safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Admin Supabase client (bypasses RLS via service role key).
 *
 * ⚠️ NEVER use in client-facing code paths.
 * Only for:
 *   - Admin operations (fraud review queue)
 *   - Scheduled jobs (listing expiration, embedding regeneration)
 *   - Internal integrations (OpenAI callbacks)
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set — admin client unavailable');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
