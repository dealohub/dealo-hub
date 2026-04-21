'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import { requestPasswordReset, type AuthActionResult } from '@/lib/auth/actions';
import AuthFormField from './auth-form-field';
import AuthSubmitButton from './auth-submit-button';

/**
 * ResetRequestForm — /reset-password entry form.
 *
 * On submit, shows a success message regardless of whether the email
 * was registered (intentional — don't leak user enumeration). Server
 * action does the email send.
 */

interface Props {
  locale: 'ar' | 'en';
}

async function action(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  return await requestPasswordReset(formData);
}

export default function ResetRequestForm({ locale }: Props) {
  const t = useTranslations('auth.reset');
  const tErr = useTranslations('auth.errors');
  const [state, dispatch] = useFormState(action, null as AuthActionResult | null);

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400"
      >
        <p className="font-semibold">{t('emailSent')}</p>
      </div>
    );
  }

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <AuthFormField
        id="reset-email"
        name="email"
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        autoComplete="email"
        required
        error={fieldErrors.email ? tErr(fieldErrors.email as any) : null}
      />

      <AuthSubmitButton label={t('submit')} loadingLabel={t('submitting')} />
    </form>
  );
}
