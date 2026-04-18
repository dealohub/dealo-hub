import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

/**
 * /my-listings — placeholder page used to prove auth-gated access.
 *
 * Real listings management UI arrives in BRIEF-004. For now we show the
 * signed-in user's email + profile display name as a sanity check.
 */
export default async function MyListingsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.myListings' });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
  }

  return (
    <main className="container py-16">
      <div className="max-w-2xl flex flex-col gap-4">
        <h1 className="text-heading-1 text-charcoal-ink">{t('title')}</h1>
        <p className="text-body text-muted-steel">
          {t('signedInAs', { name: displayName ?? user?.email ?? '' })}
        </p>
        <p className="text-body-small text-muted-steel">{t('placeholder')}</p>
      </div>
    </main>
  );
}
