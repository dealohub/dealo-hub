import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { MailCheck } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.verifyOtp' });
  return { title: t('metaTitle') };
}

/**
 * /verify-otp — Sprint 1 version: informs the user to check their email.
 *
 * The 6-box OtpInput component is built and will be wired here in Sprint 6
 * when phone signup goes live. For now the Supabase email-confirm flow
 * uses a magic-link click (handled by /auth-callback), so this page exists
 * purely as a fallback destination + placeholder for the future phone flow.
 */
export default async function VerifyOtpPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.verifyOtp' });
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
      <div
        className="
          flex flex-col items-center gap-3 py-6
          text-center
        "
      >
        <span
          className="
            flex items-center justify-center size-14 rounded-2xl
            bg-warm-amber/10 text-warm-amber-700
          "
        >
          <MailCheck className="size-7" strokeWidth={1.75} />
        </span>
        <p className="text-body text-charcoal-ink">{t('emailOnlyNote')}</p>
        <p className="text-body-small text-muted-steel">{t('phoneComingSoon')}</p>
      </div>
    </AuthCard>
  );
}
