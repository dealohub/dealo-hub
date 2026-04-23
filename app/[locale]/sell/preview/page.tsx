import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import PreviewPublish, { type PreviewData } from '@/components/sell/preview-publish';
import type {
  Condition,
  PriceMode,
  DeliveryOption,
} from '@/lib/listings/validators';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.preview' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SellPreviewPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/sell/preview`);

  const { data: draft } = await supabase
    .from('listing_drafts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!draft) redirect(`/${params.locale}/sell/category`);

  // Gate: every required step must be complete
  const needs: { slug: string; check: boolean }[] = [
    { slug: 'category', check: !!draft.category_id },
    { slug: 'media', check: (draft.image_urls ?? []).length >= 5 },
    { slug: 'details', check: !!draft.title && !!draft.description && !!draft.condition },
    { slug: 'price', check: !!draft.price_mode && !!draft.price_minor_units },
    { slug: 'location', check: !!draft.city_id },
    { slug: 'delivery', check: (draft.delivery_options ?? []).length > 0 },
  ];
  const missing = needs.find(n => !n.check);
  if (missing) redirect(`/${params.locale}/sell/${missing.slug}`);

  // Resolve display-friendly labels
  const [categoryRow, cityRow, areaRow] = await Promise.all([
    supabase
      .from('categories')
      .select('name_ar, name_en')
      .eq('id', draft.subcategory_id ?? draft.category_id)
      .maybeSingle(),
    supabase
      .from('cities')
      .select('name_ar, name_en')
      .eq('id', draft.city_id)
      .maybeSingle(),
    draft.area_id
      ? supabase
          .from('areas')
          .select('name_ar, name_en')
          .eq('id', draft.area_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const pickName = (r: { name_ar: string; name_en: string } | null) =>
    r ? (params.locale === 'ar' ? r.name_ar : r.name_en) : '';

  const data: PreviewData = {
    title: draft.title!,
    description: draft.description!,
    condition: draft.condition as Condition,
    brand: draft.brand,
    model: draft.model,
    priceMinorUnits: Number(draft.price_minor_units),
    priceMode: draft.price_mode as PriceMode,
    minOfferMinorUnits: draft.min_offer_minor_units
      ? Number(draft.min_offer_minor_units)
      : null,
    cityName: pickName(cityRow.data as any),
    areaName: pickName(areaRow.data as any) || null,
    deliveryOptions: (draft.delivery_options ?? []) as DeliveryOption[],
    imageUrls: draft.image_urls ?? [],
    categoryName: pickName(categoryRow.data as any),
  };

  return (
    <WizardShell locale={params.locale} step="preview" hideLuxury>
      <PreviewPublish locale={params.locale} data={data} />
    </WizardShell>
  );
}
