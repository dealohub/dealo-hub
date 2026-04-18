import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function CategoryNotFound() {
  const t = await getTranslations('browse.notFound');
  return (
    <div className="container py-24 flex flex-col items-center text-center gap-4">
      <h1 className="text-heading-1 font-semibold text-charcoal-ink">{t('title')}</h1>
      <p className="text-body text-muted-steel max-w-md">{t('description')}</p>
      <Link
        href="/categories"
        className="mt-2 inline-flex h-10 items-center rounded-xl bg-charcoal-ink px-5 text-body-small font-medium text-white hover:bg-charcoal-ink/90 transition-colors"
      >
        {t('backToCategories')}
      </Link>
    </div>
  );
}
