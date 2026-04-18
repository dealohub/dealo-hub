import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCategoriesWithSubs, getCurrentDraft } from '@/lib/listings/queries';
import { WizardShell } from '@/components/sell/WizardShell';
import { Step2MediaClient } from '@/components/sell/Step2MediaClient';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.media' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SellStepMedia({ params }: { params: { locale: string } }) {
  const [t, categories, draft] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'sell.steps.media' }),
    getCategoriesWithSubs(),
    getCurrentDraft(),
  ]);

  if (!draft?.category_id) {
    const locale = params.locale === 'en' ? 'en' : 'ar';
    redirect(`/${locale}/sell/category`);
  }

  const selected = categories.find(c => c.id === draft.category_id);
  const minPhotos = selected?.min_photos ?? 5;
  const requireVideo = selected?.requires_video ?? false;
  const includeAuthenticity = selected?.requires_auth_statement ?? false;

  return (
    <WizardShell
      step="media"
      title={t('title')}
      subtitle={t('subtitle')}
      includeAuthenticity={includeAuthenticity}
    >
      <Step2MediaClient
        initialImageUrls={draft.image_urls ?? []}
        initialVideoUrl={draft.video_url ?? null}
        minPhotos={minPhotos}
        requireVideo={requireVideo}
      />
    </WizardShell>
  );
}
