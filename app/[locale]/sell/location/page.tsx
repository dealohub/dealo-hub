import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import LocationForm from '@/components/sell/location-form';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.location' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SellLocationPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/sell/location`);

  const [draftRes, citiesRes] = await Promise.all([
    supabase
      .from('listing_drafts')
      .select('city_id, area_id, price_mode, category_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('cities')
      .select('id, name_ar, name_en, sort_order')
      .eq('country_code', 'KW')
      .order('sort_order', { ascending: true }),
  ]);

  const draft = draftRes.data;
  if (!draft?.category_id) redirect(`/${params.locale}/sell/category`);
  if (!draft.price_mode) redirect(`/${params.locale}/sell/price`);

  const cities = (citiesRes.data ?? []).map(c => ({
    id: c.id,
    name: params.locale === 'ar' ? c.name_ar : c.name_en,
  }));

  return (
    <WizardShell locale={params.locale} step="location">
      <LocationForm
        locale={params.locale}
        cities={cities}
        initialCityId={draft.city_id ?? null}
        initialAreaId={draft.area_id ?? null}
      />
    </WizardShell>
  );
}
