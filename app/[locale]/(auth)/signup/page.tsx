import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignUpForm } from '@/components/auth/SignUpForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signup' });
  return { title: t('metaTitle') };
}

export default async function SignUpPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signup' });
  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <span>
          {t.rich('haveAccount', {
            link: chunks => (
              <Link href="/signin" className="text-charcoal-ink font-medium hover:text-warm-amber underline underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </span>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
