'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';
import { Button } from '@/components/ui/button';
import { AuthMethodToggle, type AuthMethod } from './AuthMethodToggle';
import { PhoneInput } from './PhoneInput';
import { signUpWithEmail, type AuthActionResult } from '@/lib/auth/actions';

export function SignUpForm() {
  const t = useTranslations('auth');
  const tErr = useTranslations('auth.errors');
  const locale = useLocale();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  function handleEmailSubmit(formData: FormData) {
    formData.set('locale', locale);
    startTransition(async () => {
      const res = await signUpWithEmail(formData);
      setResult(res);
    });
  }

  // Success path — confirmation email sent
  if (result?.ok) {
    return (
      <FormMessage tone="success" className="p-4 rounded-xl bg-success-sage/5 border border-success-sage/20">
        {t('signup.checkEmail')}
      </FormMessage>
    );
  }

  const topError = result?.ok === false && !result.fieldErrors
    ? resolveAuthError(result.error, tErr)
    : null;
  const fieldErrors = result?.ok === false ? result.fieldErrors ?? {} : {};

  return (
    <div className="flex flex-col gap-5">
      <AuthMethodToggle
        value={method}
        onChange={setMethod}
        emailLabel={t('methodEmail')}
        phoneLabel={t('methodPhone')}
        comingSoonLabel={t('comingSoon')}
      />

      {method === 'phone' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">{t('signup.phoneLabel')}</Label>
          <PhoneInput name="phone" comingSoonLabel={t('comingSoon')} />
          <FormMessage tone="help">{t('signup.phoneComingSoonNote')}</FormMessage>
        </div>
      )}

      {method === 'email' && (
        <form action={handleEmailSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display_name" required>
              {t('signup.displayNameLabel')}
            </Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              required
              disabled={isPending}
              error={!!fieldErrors.display_name}
              placeholder={t('signup.displayNamePlaceholder')}
            />
            {fieldErrors.display_name && (
              <FormMessage tone="error">{tErr(fieldErrors.display_name)}</FormMessage>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" required>
              {t('signup.emailLabel')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              error={!!fieldErrors.email}
              placeholder={t('signup.emailPlaceholder')}
            />
            {fieldErrors.email && (
              <FormMessage tone="error">{tErr(fieldErrors.email)}</FormMessage>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" required>
              {t('signup.passwordLabel')}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={isPending}
              error={!!fieldErrors.password}
              placeholder={t('signup.passwordPlaceholder')}
            />
            {fieldErrors.password ? (
              <FormMessage tone="error">{tErr(fieldErrors.password)}</FormMessage>
            ) : (
              <FormMessage tone="help">{t('signup.passwordHint')}</FormMessage>
            )}
          </div>

          <label className="flex items-start gap-2 text-body-small text-muted-steel cursor-pointer select-none">
            <input
              type="checkbox"
              name="terms"
              required
              className="
                mt-1 size-4 rounded border-zinc-300
                text-warm-amber
                focus:ring-warm-amber focus:ring-offset-0
              "
            />
            <span>
              {t.rich('signup.termsAcceptance', {
                terms: chunks => (
                  <Link href="/terms" className="text-charcoal-ink underline underline-offset-2 hover:text-warm-amber">
                    {chunks}
                  </Link>
                ),
                privacy: chunks => (
                  <Link href="/privacy" className="text-charcoal-ink underline underline-offset-2 hover:text-warm-amber">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {fieldErrors.terms && <FormMessage tone="error">{tErr(fieldErrors.terms)}</FormMessage>}

          {topError && <FormMessage tone="error">{topError}</FormMessage>}

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? t('signup.submitting') : t('signup.submit')}
          </Button>
        </form>
      )}
    </div>
  );
}

function resolveAuthError(code: string, tErr: (k: string) => string): string {
  // Map top-level error codes to i18n keys; fall back to generic.
  const known = new Set([
    'email_already_registered',
    'invalid_credentials',
    'email_not_confirmed',
    'signup_failed',
    'signin_failed',
    'password_too_weak',
    'update_password_failed',
    'phone_auth_not_available',
    'validation_failed',
  ]);
  return tErr(known.has(code) ? code : 'generic');
}
