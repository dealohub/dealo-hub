import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import DetailsForm from '@/components/sell/details-form';
import type { Condition } from '@/lib/listings/validators';

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.details' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SellDetailsPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/sell/details`);

  const { data: draft } = await supabase
    .from('listing_drafts')
    .select('title, description, condition, brand, model, category_id, image_urls')
    .eq('user_id', user.id)
    .maybeSingle();

  // Step order gate: require category + min 5 photos before allowing details
  if (!draft?.category_id) redirect(`/${params.locale}/sell/category`);
  if ((draft.image_urls ?? []).length < 5) redirect(`/${params.locale}/sell/media`);

  return (
    <WizardShell locale={params.locale} step="details">
      <DetailsForm
        locale={params.locale}
        initial={{
          title: draft.title,
          description: draft.description,
          condition: draft.condition as Condition | null,
          brand: draft.brand,
          model: draft.model,
        }}
      />
    </WizardShell>
  );
}
