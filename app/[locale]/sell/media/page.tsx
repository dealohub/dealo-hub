import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ensureDraftId } from '@/lib/listings/actions';
import WizardShell from '@/components/sell/wizard-shell';
import MediaUploader from '@/components/sell/media-uploader';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'sell.steps.media',
  });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function SellMediaPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${params.locale}/signin?next=/${params.locale}/sell/media`);
  }

  const draftCheck = await ensureDraftId();
  if (!draftCheck.ok) {
    redirect(`/${params.locale}/signin`);
  }

  // Load draft to get current image_urls + resolve category for min-photos rule
  const { data: draft } = await supabase
    .from('listing_drafts')
    .select('id, image_urls, category_id, subcategory_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!draft?.category_id) {
    redirect(`/${params.locale}/sell/category`);
  }

  // Min-photos rule: luxury = 8, everything else = 5 (per PublishSchema + category.min_photos)
  const { data: cat } = await supabase
    .from('categories')
    .select('min_photos, slug, parent_id')
    .eq('id', draft.subcategory_id ?? draft.category_id)
    .maybeSingle();

  const minPhotos = cat?.min_photos ?? 5;
  const maxPhotos = 10;

  const initialUrls: string[] = draft.image_urls ?? [];

  return (
    <WizardShell locale={params.locale} step="media">
      <MediaUploader
        locale={params.locale}
        userId={user.id}
        draftId={draft.id}
        initialUrls={initialUrls}
        minPhotos={minPhotos}
        maxPhotos={maxPhotos}
      />
    </WizardShell>
  );
}
