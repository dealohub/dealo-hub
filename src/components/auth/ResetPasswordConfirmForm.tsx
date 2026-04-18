'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { Button } from '@/components/ui/Button';
import { updatePassword, type AuthActionResult } from '@/lib/auth/actions';

export function ResetPasswordConfirmForm() {
  const t = useTranslations('auth.resetConfirm');
  const tErr = useTranslations('auth.errors');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updatePassword(formData);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <FormMessage tone="success" className="p-4 rounded-xl bg-success-sage/5 border border-success-sage/20">
        {t('success')}
      </FormMessage>
    );
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors ?? {} : {};
  const topError = result?.ok === false && !result.fieldErrors ? tErr('update_password_failed') : null;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" required>
          {t('passwordLabel')}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          error={!!fieldErrors.password}
          placeholder={t('passwordPlaceholder')}
        />
        {fieldErrors.password ? (
          <FormMessage tone="error">{tErr(fieldErrors.password)}</FormMessage>
        ) : (
          <FormMessage tone="help">{t('passwordHint')}</FormMessage>
        )}
      </div>

      {topError && <FormMessage tone="error">{topError}</FormMessage>}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
