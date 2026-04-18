'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { joinWaitlist, type WaitlistResult } from '@/lib/actions/waitlist';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Waitlist email capture form.
 *
 * Progressive enhancement:
 *   - Works without JS (server action submission)
 *   - Enhanced with inline state (loading / success / error) when JS available
 *
 * UX:
 *   - Single email field (friction minimum)
 *   - Optional "I want to sell" checkbox
 *   - Success state replaces form with thank-you message
 *   - Errors inline with amber focus ring
 */
export function WaitlistForm() {
  const t = useTranslations('landing.waitlist');
  const locale = useLocale() as 'ar' | 'en';

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<WaitlistResult | null>(null);

  function handleSubmit(formData: FormData) {
    // Attach locale automatically
    formData.set('preferred_locale', locale);
    // Default country KW (V1 single-market)
    formData.set('country_code', 'KW');

    startTransition(async () => {
      const res = await joinWaitlist(formData);
      setResult(res);
    });
  }

  // Success state
  if (result?.ok) {
    return (
      <div
        role="status"
        className="
          flex items-start gap-3 p-4 rounded-xl
          bg-success-sage/5 border border-success-sage/20
        "
      >
        <CheckCircle2 className="size-5 text-success-sage shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-body font-medium text-charcoal-ink">
            {result.alreadyExists ? t('alreadyOnList') : t('success')}
          </p>
          <p className="text-body-small text-muted-steel">
            {t('successDetail')}
          </p>
        </div>
      </div>
    );
  }

  // Error state (rendered alongside form below)
  const errorMessage = result?.ok === false
    ? result.error === 'invalid_email' ? t('errorInvalidEmail')
    : result.error === 'rate_limited' ? t('errorRateLimited')
    : t('errorServer')
    : null;

  return (
    <form action={handleSubmit} className="flex flex-col gap-3" noValidate>
      {/* Email row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            aria-label={t('emailPlaceholder')}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? 'waitlist-error' : undefined}
            disabled={isPending}
            className={cn(
              'w-full h-12 px-4 rounded-xl',
              'bg-pure-surface border-[1.5px] border-ghost-border',
              'text-body text-charcoal-ink placeholder:text-muted-steel',
              'transition-all duration-150',
              'focus:outline-none focus:border-warm-amber focus:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]',
              errorMessage && 'border-danger-coral',
              isPending && 'opacity-60 cursor-not-allowed'
            )}
          />
        </div>

        <Button type="submit" size="lg" disabled={isPending} className="sm:w-auto w-full">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <span>{t('submit')}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </>
          )}
        </Button>
      </div>

      {/* Seller checkbox */}
      <label className="
        flex items-center gap-2
        text-body-small text-muted-steel
        cursor-pointer select-none
      ">
        <input
          type="checkbox"
          name="is_seller"
          className="
            size-4 rounded border-zinc-300
            text-warm-amber
            focus:ring-warm-amber focus:ring-offset-0
          "
        />
        <span>{t('sellerCheckbox')}</span>
      </label>

      {/* Error display */}
      {errorMessage && (
        <p
          id="waitlist-error"
          role="alert"
          className="
            flex items-center gap-1.5
            text-body-small text-danger-coral
          "
        >
          <AlertCircle className="size-4" />
          {errorMessage}
        </p>
      )}

      {/* Privacy note */}
      <p className="text-caption text-muted-steel">{t('privacyNote')}</p>
    </form>
  );
}
