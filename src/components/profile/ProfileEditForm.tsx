'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';
import { Button } from '@/components/ui/button';
import { HandleInput } from './HandleInput';
import { updateProfile, type ProfileActionResult } from '@/lib/profile/actions';

interface ProfileEditFormProps {
  initial: {
    id: string;
    display_name: string;
    handle: string | null;
    bio: string | null;
    preferred_locale: 'ar' | 'en';
  };
}

/**
 * ProfileEditForm — edit display_name / handle / bio / preferred_locale.
 * Avatar is edited separately via <AvatarUpload/>.
 */
export function ProfileEditForm({ initial }: ProfileEditFormProps) {
  const t = useTranslations('profile.edit');
  const tErr = useTranslations('profile.errors');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ProfileActionResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateProfile(formData);
      setResult(res);

      if (res.ok) {
        // Redirect to public profile once the write succeeded.
        const target = res.data?.handle ? `/profile/${res.data.handle}` : `/profile/u/${initial.id}`;
        router.replace(target);
        router.refresh();
      }
    });
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors ?? {} : {};
  const topError =
    result?.ok === false && !result.fieldErrors
      ? tErr(result.error === 'not_authenticated' ? 'not_authenticated' : 'update_failed')
      : null;

  return (
    <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name" required>
          {t('displayNameLabel')}
        </Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={initial.display_name}
          required
          disabled={isPending}
          error={!!fieldErrors.display_name}
          maxLength={50}
        />
        {fieldErrors.display_name && (
          <FormMessage tone="error">{tErr(fieldErrors.display_name)}</FormMessage>
        )}
      </div>

      <HandleInput
        label={t('handleLabel')}
        defaultValue={initial.handle ?? ''}
        fieldError={fieldErrors.handle ?? null}
        disabled={isPending}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">{t('bioLabel')}</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={300}
          defaultValue={initial.bio ?? ''}
          disabled={isPending}
          aria-invalid={!!fieldErrors.bio || undefined}
          placeholder={t('bioPlaceholder')}
          className="
            w-full px-4 py-3 rounded-xl resize-y
            bg-pure-surface border-[1.5px] border-ghost-border
            text-body text-charcoal-ink placeholder:text-muted-steel
            transition-[border,box-shadow] duration-150
            focus:outline-none focus:border-warm-amber
            focus:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        />
        {fieldErrors.bio ? (
          <FormMessage tone="error">{tErr(fieldErrors.bio)}</FormMessage>
        ) : (
          <FormMessage tone="help">{t('bioHint')}</FormMessage>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-body-small font-medium text-charcoal-ink mb-1">
          {t('localeLabel')}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(['ar', 'en'] as const).map(opt => (
            <label
              key={opt}
              className="
                flex items-center justify-center gap-2
                h-11 px-3 rounded-xl cursor-pointer select-none
                bg-pure-surface border-[1.5px] border-ghost-border
                text-body-small text-charcoal-ink
                transition-all duration-150
                hover:border-warm-amber/60
                has-[:checked]:border-warm-amber
                has-[:checked]:bg-warm-amber/5
                has-[:checked]:font-semibold
              "
            >
              <input
                type="radio"
                name="preferred_locale"
                value={opt}
                defaultChecked={initial.preferred_locale === opt}
                className="sr-only"
              />
              <span lang={opt}>{t(`localeOptions.${opt}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {topError && <FormMessage tone="error">{topError}</FormMessage>}

      {/* Preserve the UI locale on redirect; server action ignores it but form-scope consistency is useful. */}
      <input type="hidden" name="locale" value={locale} />

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={isPending}
          onClick={() => router.back()}
        >
          {t('cancel')}
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
