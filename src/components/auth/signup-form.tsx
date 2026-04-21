'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import { signUpWithEmail, type AuthActionResult } from '@/lib/auth/actions';
import AuthFormField from './auth-form-field';
import AuthSubmitButton from './auth-submit-button';

/**
 * SignupForm — client form for /signup. Mirrors SigninForm patterns
 * for field-error surfacing. On success, shows the check-email state
 * in place of the form (Supabase sends a verification email; user
 * lands back at /auth-callback).
 */

interface Props {
  locale: 'ar' | 'en';
}

async function action(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  return await signUpWithEmail(formData);
}

export default function SignupForm({ locale }: Props) {
  const t = useTranslations('auth.signup');
  const tErr = useTranslations('auth.errors');
  const [state, dispatch] = useFormState(action, null as AuthActionResult | null);

  // Success path — show check-email message
  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400"
      >
        <p className="font-semibold">{t('checkEmail')}</p>
      </div>
    );
  }

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
          {tErr(genericError as any, { default: tErr('generic') })}
        </div>
      )}

      <AuthFormField
        id="signup-name"
        name="display_name"
        type="text"
        label={t('displayNameLabel')}
        placeholder={t('displayNamePlaceholder')}
        autoComplete="name"
        required
        error={fieldErrors.display_name ? tErr(fieldErrors.display_name as any) : null}
      />

      <AuthFormField
        id="signup-email"
        name="email"
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        autoComplete="email"
        required
        error={fieldErrors.email ? tErr(fieldErrors.email as any) : null}
      />

      <AuthFormField
        id="signup-password"
        name="password"
        type="password"
        label={t('passwordLabel')}
        placeholder={t('passwordPlaceholder')}
        autoComplete="new-password"
        required
        hint={t('passwordHint')}
        error={fieldErrors.password ? tErr(fieldErrors.password as any) : null}
      />

      {/* Terms */}
      <label className="flex items-start gap-2 text-xs text-foreground/70">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 h-4 w-4 rounded border-border/60 text-primary focus:ring-2 focus:ring-primary/30"
        />
        <span className="flex-1 leading-snug">
          {t('termsAcceptance')}
        </span>
      </label>
      {fieldErrors.terms && (
        <p role="alert" className="text-[11px] text-rose-500">
          {tErr(fieldErrors.terms as any)}
        </p>
      )}

      <AuthSubmitButton label={t('submit')} loadingLabel={t('submitting')} />
    </form>
  );
}
