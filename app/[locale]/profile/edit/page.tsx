import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile/queries';
import ProfileEditForm from '@/components/account/profile-edit-form';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'profile.edit' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function ProfileEditPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/profile/edit`);

  const profile = await getCurrentProfile();
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'profile.edit',
  });

  return (
    <>
      <EcommerceNavbar1 />
      <main className="mx-auto max-w-xl px-4 py-8 md:py-12">
        <header className="mb-6">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">{t('subtitle')}</p>
        </header>
        <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
          <ProfileEditForm
            locale={params.locale}
            initial={{
              display_name: profile?.display_name ?? '',
              handle: profile?.handle ?? '',
              bio: profile?.bio ?? '',
              preferred_locale: (profile?.preferred_locale ?? params.locale) as 'ar' | 'en',
            }}
          />
        </div>
      </main>
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
