import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/profile/queries';

interface PageProps {
  params: { locale: string };
}

/**
 * /profile/me — resolves to the caller's public profile URL.
 *   - handle set → /profile/{handle}
 *   - no handle   → /profile/u/{uuid}
 *   - no session  → middleware already redirected to /signin (this is under (app))
 */
export default async function ProfileMeRedirect({ params }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    // (app) layout + middleware guarantee a session; bail safely if the race loses.
    redirect(`/${params.locale === 'en' ? 'en' : 'ar'}/signin`);
  }

  const locale = params.locale === 'en' ? 'en' : 'ar';
  const target = profile.handle
    ? `/${locale}/profile/${profile.handle}`
    : `/${locale}/profile/u/${profile.id}`;

  redirect(target);
}
