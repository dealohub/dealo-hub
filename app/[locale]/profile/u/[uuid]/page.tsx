import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getProfileByUuid,
  getCurrentProfile,
} from '@/lib/profile/queries';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileCompletionBanner } from '@/components/profile/ProfileCompletionBanner';
import { ProfileListingsPlaceholder } from '@/components/profile/ProfileListingsPlaceholder';

interface PageProps {
  params: { locale: string; uuid: string };
}

/**
 * Fallback profile URL for users without a handle yet.
 * If a handle IS set, we 301-style redirect to the pretty URL.
 */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfileByUuid(params.uuid);
  if (!profile) {
    const t = await getTranslations({ locale: params.locale, namespace: 'profile.notFound' });
    return { title: t('metaTitle') };
  }
  return {
    title: `${profile.display_name} · Dealo Hub`,
    // Keep UUID-URL pages out of search — canonical is the handle URL.
    robots: { index: false, follow: false },
    alternates: profile.handle ? { canonical: `/profile/${profile.handle}` } : undefined,
  };
}

export default async function PublicProfileByUuid({ params }: PageProps) {
  const profile = await getProfileByUuid(params.uuid);
  if (!profile) notFound();

  // If the user has picked a handle since this URL was shared, send them there.
  if (profile.handle) {
    redirect(`/${params.locale === 'en' ? 'en' : 'ar'}/profile/${profile.handle}`);
  }

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
