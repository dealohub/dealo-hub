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
import { signInWithEmail, type AuthActionResult } from '@/lib/auth/actions';

export function SignInForm() {
  const t = useTranslations('auth');
  const tErr = useTranslations('auth.errors');
  const locale = useLocale();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  function handleEmailSubmit(formData: FormData) {
    formData.set('locale', locale);
    startTransition(async () => {
      const res = await signInWithEmail(formData);
      // signInWithEmail redirects on success — if we reach here it failed.
      setResult(res);
    });
  }

  const topError =
    result?.ok === false && !result.fieldErrors ? resolveAuthError(result.error, tErr) : null;
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
          <Label htmlFor="phone">{t('signin.phoneLabel')}</Label>
          <PhoneInput name="phone" comingSoonLabel={t('comingSoon')} />
          <FormMessage tone="help">{t('signup.phoneComingSoonNote')}</FormMessage>
        </div>
      )}

      {method === 'email' && (
        <form action={handleEmailSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" required>
              {t('signin.emailLabel')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              error={!!fieldErrors.email}
              placeholder={t('signin.emailPlaceholder')}
            />
            {fieldErrors.email && (
              <FormMessage tone="error">{tErr(fieldErrors.email)}</FormMessage>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                {t('signin.passwordLabel')}
              </Label>
              <Link
                href="/reset-password"
                className="text-body-small text-muted-steel hover:text-warm-amber underline underline-offset-2"
              >
                {t('signin.forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              error={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <FormMessage tone="error">{tErr(fieldErrors.password)}</FormMessage>
            )}
          </div>

          {topError && <FormMessage tone="error">{topError}</FormMessage>}

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? t('signin.submitting') : t('signin.submit')}
          </Button>
        </form>
      )}
    </div>
  );
}

function resolveAuthError(code: string, tErr: (k: string) => string): string {
  const known = new Set([
    'email_already_registered',
    'invalid_credentials',
    'email_not_confirmed',
    'signup_failed',
    'signin_failed',
    'password_too_weak',
    'phone_auth_not_available',
    'validation_failed',
  ]);
  return tErr(known.has(code) ? code : 'generic');
}
