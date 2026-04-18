import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCategoriesWithSubs, getCurrentDraft } from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { PriceForm } from '@/components/sell/PriceForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.price' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepPrice({ params }: { params: { locale: string } }) {
  const [t, categories, draft] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.price' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
  ]);

  if (!draft?.category_id) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/category`);
  }

  const selected = categories.find(c => c.id === draft.category_id);
  const includeAuthenticity = selected?.requires_auth_statement ?? false;

  return (
    <WizardShell
      step="price"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={includeAuthenticity}
    >
      <PriceForm
        initial={{
          price_minor_units: draft.price_minor_units ?? null,
          price_mode: draft.price_mode ?? null,
          min_offer_minor_units: draft.min_offer_minor_units ?? null,
        }}
      />
    </WizardShell>
  );
}
