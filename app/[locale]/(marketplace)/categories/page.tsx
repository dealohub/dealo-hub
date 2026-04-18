import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CategoryGrid } from '@/components/browse/CategoryGrid';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'browse.index' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function CategoriesIndexPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'browse.index' });

  return (
    <div className="container py-10 sm:py-14">
      <header className="mb-8 sm:mb-10 max-w-3xl">
        <h1 className="text-display font-bold text-charcoal-ink tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-4 text-body-large text-muted-steel">{t('subtitle')}</p>
      </header>
      <CategoryGrid />
    </div>
  );
}
