'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signInWithEmail, type AuthActionResult } from '@/lib/auth/actions';
import AuthFormField from './auth-form-field';
import AuthSubmitButton from './auth-submit-button';

/**
 * SigninForm — client form for /signin. Uses useFormState to preserve
 * field errors + generic errors across the server action round-trip.
 *
 * A successful sign-in triggers a server-side redirect (the action
 * calls redirect(localePrefix)) — this component's state only ever
 * reflects failure cases.
 */

interface Props {
  locale: 'ar' | 'en';
}

async function action(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  // signInWithEmail can either return { ok, error, ... } OR redirect
  // (on success, throwing a NEXT_REDIRECT signal that we must re-throw).
  try {
    return await signInWithEmail(formData);
  } catch (err) {
    throw err; // preserve redirect signaling
  }
}

export default function SigninForm({ locale }: Props) {
  const t = useTranslations('auth.signin');
  const tErr = useTranslations('auth.errors');
  const [state, dispatch] = useFormState(action, null);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const genericError =
    state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {genericError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400"
        >
          {tErr(genericError as any, {
            default: tErr('generic'),
          })}
        </div>
      )}

      <AuthFormField
        id="signin-email"
        name="email"
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        autoComplete="email"
        required
        error={fieldErrors.email ? tErr(fieldErrors.email as any) : null}
      />

      <AuthFormField
        id="signin-password"
        name="password"
        type="password"
        label={t('passwordLabel')}
        autoComplete="current-password"
        required
        error={fieldErrors.password ? tErr(fieldErrors.password as any) : null}
      />

      <div className="flex items-center justify-end">
        <Link
          href={`/${locale}/reset-password`}
          className="text-xs text-foreground/60 transition hover:text-foreground"
        >
          {t('forgotPassword')}
        </Link>
      </div>

      <AuthSubmitButton label={t('submit')} loadingLabel={t('submitting')} />
    </form>
  );
}
