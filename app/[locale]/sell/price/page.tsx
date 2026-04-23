import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import PriceForm from '@/components/sell/price-form';
import type { PriceMode } from '@/lib/listings/validators';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.price' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SellPricePage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/sell/price`);

  const { data: draft } = await supabase
    .from('listing_drafts')
    .select('price_minor_units, price_mode, min_offer_minor_units, category_id, title')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!draft?.category_id) redirect(`/${params.locale}/sell/category`);
  if (!draft.title) redirect(`/${params.locale}/sell/details`);

  return (
    <WizardShell locale={params.locale} step="price">
      <PriceForm
        locale={params.locale}
        initial={{
          price_minor_units: draft.price_minor_units ?? null,
          price_mode: draft.price_mode as PriceMode | null,
          min_offer_minor_units: draft.min_offer_minor_units ?? null,
        }}
      />
    </WizardShell>
  );
}
