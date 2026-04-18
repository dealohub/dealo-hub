import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getCategoriesWithSubs,
  getCurrentDraft,
  getKuwaitCities,
} from '@/lib/listings/queries';
import { createClient } from '@/lib/supabase/server';
import { WizardShell } from '@/components/sell/WizardShell';
import { PreviewCard } from '@/components/sell/PreviewCard';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.preview' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepPreview({ params }: { params: { locale: string } }) {
  const [t, categories, draft, cities] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.preview' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
    getKuwaitCities(),
  ]);

  if (!draft?.category_id) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/category`);
  }

  const locale = params.locale === 'en' ? 'en' : 'ar';
  const nameOf = (o: { name_ar: string; name_en: string } | undefined | null) =>
    !o ? '' : locale === 'ar' ? o.name_ar : o.name_en;

  const parent = categories.find(c => c.id === draft.category_id);
  const sub =
    draft.subcategory_id != null
      ? parent?.sub_categories.find(s => s.id === draft.subcategory_id) ?? null
      : null;
  const isLuxury = parent?.requires_auth_statement ?? false;

  const city = cities.find(c => c.id === draft.city_id) ?? null;

  // Area name — single lookup (areas aren't preloaded).
  let areaName: string | null = null;
  if (draft.area_id != null) {
    const supabase = createClient();
    const { data: area } = await supabase
      .from('areas')
      .select('name_ar, name_en')
      .eq('id', draft.area_id)
      .maybeSingle();
    if (area) areaName = locale === 'ar' ? area.name_ar : area.name_en;
  }

  return (
    <WizardShell
      step="preview"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={isLuxury}
    >
      <PreviewCard
        draft={{
          title: draft.title ?? '',
          description: draft.description ?? '',
          condition: draft.condition ?? null,
          brand: draft.brand ?? null,
          model: draft.model ?? null,
          category_name: nameOf(parent),
          subcategory_name: sub ? nameOf(sub) : null,
          price_minor_units: draft.price_minor_units ?? null,
          price_mode: draft.price_mode ?? null,
          min_offer_minor_units: draft.min_offer_minor_units ?? null,
          city_name: nameOf(city),
          area_name: areaName,
          delivery_options: draft.delivery_options ?? [],
          authenticity_confirmed: draft.authenticity_confirmed ?? false,
          has_receipt: draft.has_receipt ?? false,
          serial_number: draft.serial_number ?? null,
          image_urls: draft.image_urls ?? [],
          video_url: draft.video_url ?? null,
          is_luxury: isLuxury,
        }}
      />
    </WizardShell>
  );
}
