import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile/queries';

/**
 * /profile/me — redirects to the current user's public profile
 * /profile/[handle] (or /profile/edit if they haven't set a handle).
 */
export default async function ProfileMeRedirect(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/profile/me`);

  const profile = await getCurrentProfile();
  if (!profile || !profile.handle) {
    redirect(`/${params.locale}/profile/edit`);
  }
  redirect(`/${params.locale}/profile/${profile.handle}`);
}
