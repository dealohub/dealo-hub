import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import AuthCard from '@/components/auth/auth-card';
import ResetRequestForm from '@/components/auth/reset-request-form';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.reset' });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.reset' });
  return (
    <AuthCard
      locale={params.locale}
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <Link
          href={`/${params.locale}/signin`}
          className="inline-flex items-center gap-1 text-foreground/60 transition hover:text-foreground"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('backLink')}
        </Link>
      }
    >
      <ResetRequestForm locale={params.locale} />
    </AuthCard>
  );
}
