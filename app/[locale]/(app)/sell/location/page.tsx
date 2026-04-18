import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getCategoriesWithSubs,
  getCurrentDraft,
  getKuwaitCities,
} from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { LocationForm } from '@/components/sell/LocationForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.location' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepLocation({ params }: { params: { locale: string } }) {
  const [t, categories, draft, cities] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.location' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
    getKuwaitCities(),
  ]);

  if (!draft?.category_id) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/category`);
  }

  const selected = categories.find(c => c.id === draft.category_id);
  const includeAuthenticity = selected?.requires_auth_statement ?? false;

  return (
    <WizardShell
      step="location"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={includeAuthenticity}
    >
      <LocationForm
        cities={cities}
        initial={{ city_id: draft.city_id ?? null, area_id: draft.area_id ?? null }}
      />
    </WizardShell>
  );
}
