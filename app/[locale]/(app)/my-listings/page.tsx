import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { getCurrentProfile } from '@/lib/profile/queries';

/**
 * /my-listings — placeholder page for auth-gated access.
 * Real listings management UI arrives in BRIEF-004.
 */
export default async function MyListingsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.myListings' });
  const profile = await getCurrentProfile();

  const profileHref = profile?.handle
    ? `/profile/${profile.handle}`
    : profile
      ? `/profile/u/${profile.id}`
      : '/profile/me';

  return (
    <main className="container py-16">
      <div className="max-w-2xl flex flex-col gap-4">
        <h1 className="text-heading-1 text-charcoal-ink">{t('title')}</h1>
        <p className="text-body text-muted-steel">
          {t('signedInAs', { name: profile?.display_name ?? '' })}
        </p>
        <p className="text-body-small text-muted-steel">{t('placeholder')}</p>

        <div>
          <Link href={profileHref}>
            <Button variant="secondary" size="sm">
              <span>{t('viewProfile')}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
