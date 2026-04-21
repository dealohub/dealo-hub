'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { updatePassword, type AuthActionResult } from '@/lib/auth/actions';
import AuthFormField from './auth-form-field';
import AuthSubmitButton from './auth-submit-button';

/**
 * ResetConfirmForm — /reset-password/confirm page form.
 *
 * Arrival flow: user clicks Supabase reset email link, which lands
 * them here with a session already established (Supabase handles the
 * token hand-off via its auth cookies). This form then just calls
 * updatePassword.
 */

interface Props {
  locale: 'ar' | 'en';
}

async function action(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  return await updatePassword(formData);
}

export default function ResetConfirmForm({ locale }: Props) {
  const t = useTranslations('auth.resetConfirm');
  const tErr = useTranslations('auth.errors');
  const [state, dispatch] = useFormState(action, null as AuthActionResult | null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <p className="font-semibold">{t('success')}</p>
        </div>
        <Link
          href={`/${locale}/signin`}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          {t('backLink')}
        </Link>
      </div>
    );
  }

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const genericError =
    state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <form action={dispatch} className="space-y-4">
      {genericError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400"
        >
          {tErr(genericError as any, { default: tErr('generic') })}
        </div>
      )}

      <AuthFormField
        id="reset-confirm-password"
        name="password"
        type="password"
        label={t('passwordLabel')}
        placeholder={t('passwordPlaceholder')}
        autoComplete="new-password"
        required
        hint={t('passwordHint')}
        error={fieldErrors.password ? tErr(fieldErrors.password as any) : null}
      />

      <AuthSubmitButton label={t('submit')} loadingLabel={t('submitting')} />
    </form>
  );
}
