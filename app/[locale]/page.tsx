import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { CategoriesPreview } from '@/components/landing/CategoriesPreview';
import { TrustPillars } from '@/components/landing/TrustPillars';

/**
 * Landing page (V1 / Beta waitlist).
 *
 * Structure (top to bottom):
 *   Nav         — brand + locale toggle (sticky)
 *   Hero        — headline + waitlist form + decorative cards
 *   TrustPillars — 3 anti-Dubizzle moats
 *   CategoriesPreview — 10 categories grid
 *   Footer      — copyright + launch marker
 *
 * Replaces the placeholder bootstrap page from Task #9.
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
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale === 'ar' ? 'ar_KW' : 'en_US',
      type: 'website',
    },
  };
}

export default function LandingPage() {
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
