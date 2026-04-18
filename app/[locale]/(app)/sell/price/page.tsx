import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StepStub } from '@/components/sell/StepStub';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.price' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStep_price({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.price' });
  return (
    <StepStub
      step="price"
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
    />
  );
}
