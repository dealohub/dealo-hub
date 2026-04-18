import { getTranslations } from 'next-intl/server';
import { UserX } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';

/**
 * /profile/[handle] not-found page. Rendered when `getProfileByHandle` returns null.
 * Custom-branded instead of Next.js generic to match the rest of the app.
 */
export default async function ProfileNotFound() {
  const t = await getTranslations('profile.notFound');
  return (
    <main className="container py-16">
      <div className="max-w-md mx-auto flex flex-col items-center gap-4 text-center">
        <span
          className="
            flex items-center justify-center size-14 rounded-2xl
            bg-canvas-zinc text-muted-steel
          "
          aria-hidden="true"
        >
          <UserX className="size-6" strokeWidth={1.75} />
        </span>
        <h1 className="text-heading-1 text-charcoal-ink">{t('title')}</h1>
        <p className="text-body text-muted-steel">{t('subtitle')}</p>
        <Link href="/" className="mt-2">
          <Button variant="secondary" size="md">
            {t('home')}
          </Button>
        </Link>
      </div>
    </main>
  );
}
