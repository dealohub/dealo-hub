import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AuthCard from '@/components/auth/auth-card';
import ResetConfirmForm from '@/components/auth/reset-confirm-form';

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'auth.resetConfirm',
  });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordConfirmPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'auth.resetConfirm',
  });
  return (
    <AuthCard
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <ResetConfirmForm locale={params.locale} />
    </AuthCard>
  );
}
