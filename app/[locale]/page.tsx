import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { CategoriesPreview } from '@/components/landing/CategoriesPreview';
import { TrustPillars } from '@/components/landing/TrustPillars';
import { HomeMarketplace } from '@/components/browse/HomeMarketplace';
import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/i18n/routing';

/**
 * Root — splits by auth state:
 *   Anonymous → landing / waitlist funnel
 *   Authenticated → marketplace home (search + categories + featured + recent)
 */

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: '/ar', en: '/en' },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale === 'ar' ? 'ar_KW' : 'en_US',
      type: 'website',
    },
  };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const typedLocale = (locale === 'en' ? 'en' : 'ar') as Locale;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main id="main">
          <Hero />
          <TrustPillars />
          <CategoriesPreview />
        </main>
        <Footer />
      </>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main id="main" className="flex-1">
        <HomeMarketplace locale={typedLocale} displayName={profile?.display_name ?? undefined} />
      </main>
      <Footer />
    </div>
  );
}
