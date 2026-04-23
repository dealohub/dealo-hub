import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import AuthCard from '@/components/auth/auth-card';
import SigninForm from '@/components/auth/signin-form';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signin' });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function SigninPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signin' });
  return (
    <AuthCard
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <span>
          {t.rich('noAccount', {
            link: chunks => (
              <Link
                href={`/${params.locale}/signup`}
                className="font-semibold text-primary transition hover:text-primary/80"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      }
    >
      <SigninForm locale={params.locale} />
    </AuthCard>
  );
}
