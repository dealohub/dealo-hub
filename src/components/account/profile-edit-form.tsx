'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import { updateProfile, type ProfileActionResult } from '@/lib/profile/actions';
import AuthFormField from '@/components/auth/auth-form-field';
import AuthSubmitButton from '@/components/auth/auth-submit-button';

/**
 * ProfileEditForm — client form wrapping updateProfile server action.
 *
 * Reuses the auth form primitives (AuthFormField, AuthSubmitButton) for
 * consistent field styling + a11y + useFormState error plumbing.
 */

interface Props {
  locale: 'ar' | 'en';
  initial: {
    display_name: string;
    handle: string;
    bio: string;
    preferred_locale: 'ar' | 'en';
  };
}

async function action(
  _prev: ProfileActionResult | null,
  formData: FormData,
): Promise<ProfileActionResult> {
  return await updateProfile(formData);
}

export default function ProfileEditForm({ locale: _locale, initial }: Props) {
  const t = useTranslations('profile.edit');
  const tErr = useTranslations('profile.errors');
  const [state, dispatch] = useFormState(action, null as ProfileActionResult | null);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const genericError =
    state && !state.ok && !state.fieldErrors ? state.error : null;
  const success = state && state.ok;

  return (
    <form action={dispatch} className="space-y-4">
      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400"
        >
          {t('saveSuccess')}
        </div>
      )}
      {genericError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {tErr(genericError as any, { default: tErr('generic') })}
        </div>
      )}

      <AuthFormField
        id="profile-name"
        name="display_name"
        type="text"
        label={t('displayNameLabel')}
        placeholder={t('displayNamePlaceholder')}
        autoComplete="name"
        defaultValue={initial.display_name}
        required
        error={fieldErrors.display_name ? tErr(fieldErrors.display_name as any) : null}
      />

      <AuthFormField
        id="profile-handle"
        name="handle"
        type="text"
        label={t('handleLabel')}
        placeholder={t('handlePlaceholder')}
        defaultValue={initial.handle}
        hint={t('handleHint')}
        dir="ltr"
        error={fieldErrors.handle ? tErr(fieldErrors.handle as any) : null}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="profile-bio"
          className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
        >
          {t('bioLabel')}
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          defaultValue={initial.bio}
          rows={4}
          maxLength={300}
          placeholder={t('bioPlaceholder')}
          className="block w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {fieldErrors.bio && (
          <p className="text-[11px] text-rose-500">
            {tErr(fieldErrors.bio as any)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="profile-locale"
          className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
        >
          {t('localeLabel')}
        </label>
        <select
          id="profile-locale"
          name="preferred_locale"
          defaultValue={initial.preferred_locale}
          className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </div>

      <AuthSubmitButton label={t('save')} loadingLabel={t('saving')} />
    </form>
  );
}
