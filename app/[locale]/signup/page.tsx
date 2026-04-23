import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import AuthCard from '@/components/auth/auth-card';
import SignupForm from '@/components/auth/signup-form';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signup' });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function SignupPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signup' });
  return (
    <AuthCard
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <span>
          {t.rich('haveAccount', {
            link: chunks => (
              <Link
                href={`/${params.locale}/signin`}
                className="font-semibold text-primary transition hover:text-primary/80"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      }
    >
      <SignupForm locale={params.locale} />
    </AuthCard>
  );
}
