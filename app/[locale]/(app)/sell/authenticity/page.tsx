import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCategoriesWithSubs, getCurrentDraft } from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { AuthenticityForm } from '@/components/sell/AuthenticityForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.authenticity' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepAuthenticity({ params }: { params: { locale: string } }) {
  const [t, categories, draft] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.authenticity' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
  ]);

  if (!draft?.category_id) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/category`);
  }

  const selected = categories.find(c => c.id === draft.category_id);
  // If the chosen category doesn't require authenticity, skip directly to preview.
  if (!selected?.requires_auth_statement) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/preview`);
  }

  return (
    <WizardShell
      step="authenticity"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={true}
    >
      <AuthenticityForm
        initial={{
          authenticity_confirmed: draft.authenticity_confirmed ?? false,
          has_receipt: draft.has_receipt ?? false,
          serial_number: draft.serial_number ?? null,
        }}
      />
    </WizardShell>
  );
}
