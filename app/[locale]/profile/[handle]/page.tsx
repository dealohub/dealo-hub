import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getProfileByHandle,
  getCurrentProfile,
} from '@/lib/profile/queries';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileCompletionBanner } from '@/components/profile/ProfileCompletionBanner';
import { ProfileListingsPlaceholder } from '@/components/profile/ProfileListingsPlaceholder';

interface PageProps {
  params: { locale: string; handle: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfileByHandle(params.handle);
  if (!profile) {
    const t = await getTranslations({ locale: params.locale, namespace: 'profile.notFound' });
    return { title: t('metaTitle') };
  }

  const t = await getTranslations({ locale: params.locale, namespace: 'profile.public' });
  const desc =
    profile.bio ??
    t('defaultDescription', {
      name: profile.display_name,
      count: profile.active_listings_count,
    });

  return {
    title: `${profile.display_name} · Dealo Hub`,
    description: desc,
    openGraph: {
      title: profile.display_name,
      description: desc,
      images: profile.avatar_url ? [profile.avatar_url] : [],
      type: 'profile',
    },
    // Public profiles are safe to index once we have >0 listings; conservative until then.
    robots: profile.active_listings_count > 0 ? { index: true, follow: true } : { index: false },
  };
}

export default async function PublicProfileByHandle({ params }: PageProps) {
  const profile = await getProfileByHandle(params.handle);
  if (!profile) notFound();

  const currentProfile = await getCurrentProfile();
  const isOwner = currentProfile?.id === profile.id;

  return (
    <main className="container py-10 sm:py-14">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {isOwner && <ProfileCompletionBanner profile={profile} />}
        <ProfileHeader profile={profile} isOwner={isOwner} />
        <div className="h-px bg-whisper-divider" role="presentation" />
        <ProfileListingsPlaceholder />
      </div>
    </main>
  );
}
