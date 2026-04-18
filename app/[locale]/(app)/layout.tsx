import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/layout/Nav';

/**
 * (app) route-group layout — only reachable when authenticated.
 *
 * Middleware also guards these paths as a first-line defense, but we double-check
 * here so SSR fetches never leak data to unauthenticated users.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/signin`);
  }

  return (
    <>
      <Nav />
      {children}
    </>
  );
}
