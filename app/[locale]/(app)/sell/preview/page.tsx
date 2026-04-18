import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StepStub } from '@/components/sell/StepStub';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.preview' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStep_preview({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.preview' });
  return (
    <StepStub
      step="preview"
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
    />
  );
}
