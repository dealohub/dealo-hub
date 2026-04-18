import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getCategoriesWithSubs, getCurrentDraft } from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { CategoryPicker } from '@/components/sell/CategoryPicker';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.category' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStep1Category({ params }: { params: { locale: string } }) {
  const [t, categories, draft] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.category' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
  ]);

  // Determine whether we include the luxury Step 7 based on the current draft's category.
  const selectedParent = categories.find(c => c.id === draft?.category_id);
  const includeAuthenticity = selectedParent?.requires_auth_statement ?? false;

  return (
    <WizardShell
      step="category"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={includeAuthenticity}
    >
      <CategoryPicker
        categories={categories}
        initialCategoryId={draft?.category_id ?? null}
        initialSubcategoryId={draft?.subcategory_id ?? null}
      />
    </WizardShell>
  );
}
