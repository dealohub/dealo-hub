import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getCategoriesWithSubs, getCurrentDraft } from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { DeliveryOptionsForm } from '@/components/sell/DeliveryOptionsForm';
import type { DeliveryOption } from '@/lib/listings/validators';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.delivery' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepDelivery({ params }: { params: { locale: string } }) {
  const [t, categories, draft] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.delivery' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
  ]);

  if (!draft?.category_id) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/category`);
  }

  const selected = categories.find(c => c.id === draft.category_id);
  const includeAuthenticity = selected?.requires_auth_statement ?? false;

  // Pull category defaults from the DB (default_delivery_options column).
  const supabase = createClient();
  const { data: row } = await supabase
    .from('categories')
    .select('default_delivery_options')
    .eq('id', draft.category_id)
    .maybeSingle();
  const categoryDefaults =
    (row?.default_delivery_options as DeliveryOption[] | null) ??
    (['pickup', 'seller_delivers', 'buyer_ships'] as DeliveryOption[]);

  return (
    <WizardShell
      step="delivery"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={includeAuthenticity}
    >
      <DeliveryOptionsForm
        initial={(draft.delivery_options ?? []) as DeliveryOption[]}
        categoryDefaults={categoryDefaults}
        skipAuthenticity={!includeAuthenticity}
      />
    </WizardShell>
  );
}
