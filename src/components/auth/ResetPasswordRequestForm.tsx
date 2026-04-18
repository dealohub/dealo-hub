'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { Button } from '@/components/ui/Button';
import { requestPasswordReset, type AuthActionResult } from '@/lib/auth/actions';

export function ResetPasswordRequestForm() {
  const t = useTranslations('auth.reset');
  const tErr = useTranslations('auth.errors');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  function handleSubmit(formData: FormData) {
    formData.set('locale', locale);
    startTransition(async () => {
      const res = await requestPasswordReset(formData);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <FormMessage tone="success" className="p-4 rounded-xl bg-success-sage/5 border border-success-sage/20">
        {t('emailSent')}
      </FormMessage>
    );
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors ?? {} : {};

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" required>
          {t('emailLabel')}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          error={!!fieldErrors.email}
          placeholder={t('emailPlaceholder')}
        />
        {fieldErrors.email && <FormMessage tone="error">{tErr(fieldErrors.email)}</FormMessage>}
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
