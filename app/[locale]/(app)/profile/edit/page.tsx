import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentProfile } from '@/lib/profile/queries';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'profile.edit' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function EditProfilePage({ params }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${params.locale === 'en' ? 'en' : 'ar'}/signin`);
  }

  const t = await getTranslations({ locale: params.locale, namespace: 'profile.edit' });

  return (
    <main className="container py-10 sm:py-14">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-heading-1 text-charcoal-ink">{t('title')}</h1>
          <p className="text-body text-muted-steel">{t('subtitle')}</p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-heading-3 text-charcoal-ink">{t('avatarHeading')}</h2>
          <AvatarUpload
            currentUrl={profile.avatar_url}
            displayName={profile.display_name}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-heading-3 text-charcoal-ink">{t('detailsHeading')}</h2>
          <ProfileEditForm
            initial={{
              id: profile.id,
              display_name: profile.display_name,
              handle: profile.handle,
              bio: profile.bio,
              preferred_locale: (profile.preferred_locale as 'ar' | 'en') ?? 'ar',
            }}
          />
        </section>
      </div>
    </main>
  );
}
