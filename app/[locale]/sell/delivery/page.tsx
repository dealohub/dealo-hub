import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import DeliveryForm from '@/components/sell/delivery-form';
import type { DeliveryOption } from '@/lib/listings/validators';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.delivery' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SellDeliveryPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/sell/delivery`);

  const { data: draft } = await supabase
    .from('listing_drafts')
    .select('delivery_options, city_id, category_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!draft?.category_id) redirect(`/${params.locale}/sell/category`);
  if (!draft.city_id) redirect(`/${params.locale}/sell/location`);

  return (
    <WizardShell locale={params.locale} step="delivery">
      <DeliveryForm
        locale={params.locale}
        initialOptions={(draft.delivery_options ?? []) as DeliveryOption[]}
      />
    </WizardShell>
  );
}
