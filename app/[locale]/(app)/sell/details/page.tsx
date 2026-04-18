import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCategoriesWithSubs, getCurrentDraft } from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { DetailsForm } from '@/components/sell/DetailsForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.details' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepDetails({ params }: { params: { locale: string } }) {
  const [t, categories, draft] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.details' }),
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
      step="details"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={includeAuthenticity}
    >
      <DetailsForm
        initial={{
          title: draft.title ?? '',
          description: draft.description ?? '',
          condition: draft.condition ?? null,
          brand: draft.brand ?? null,
          model: draft.model ?? null,
        }}
        isLuxury={includeAuthenticity}
      />
    </WizardShell>
  );
}
