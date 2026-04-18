import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordRequestForm } from '@/components/auth/ResetPasswordRequestForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.reset' });
  return { title: t('metaTitle') };
}

export default async function ResetPasswordPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.reset' });
  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <span>
          {t.rich('backLink', {
            link: chunks => (
              <Link href="/signin" className="text-charcoal-ink font-medium hover:text-warm-amber underline underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </span>
      }
    >
      <ResetPasswordRequestForm />
    </AuthCard>
  );
}
