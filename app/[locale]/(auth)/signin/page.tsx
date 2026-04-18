import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignInForm } from '@/components/auth/SignInForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signin' });
  return { title: t('metaTitle') };
}

export default async function SignInPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signin' });
  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <span>
          {t.rich('noAccount', {
            link: chunks => (
              <Link href="/signup" className="text-charcoal-ink font-medium hover:text-warm-amber underline underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </span>
      }
    >
      <SignInForm />
    </AuthCard>
  );
}
