import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import AuthCard from '@/components/auth/auth-card';
import SignupForm from '@/components/auth/signup-form';

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signup' });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function SignupPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signup' });
  return (
    <AuthCard
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <span>
          {t('haveAccount')}{' '}
          <Link
            href={`/${params.locale}/signin`}
            className="font-semibold text-primary transition hover:text-primary/80"
          >
            {t('cta')}
          </Link>
        </span>
      }
    >
      <SignupForm locale={params.locale} />
    </AuthCard>
  );
}
