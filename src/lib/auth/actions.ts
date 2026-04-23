'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  SignUpEmailSchema,
  SignInEmailSchema,
  ResetPasswordRequestSchema,
  ResetPasswordConfirmSchema,
} from './validators';

/**
 * Auth server actions.
 *
 * Sprint 1 scope: **email only**. Phone auth is UI-visible but disabled; the
 * phone server actions below are stubs that throw — they will be filled in
 * Sprint 6 when Twilio + Kuwait sender-ID registration lands.
 *
 * Every action returns a plain object `{ ok, error?, data? }` that the caller
 * maps to i18n messages. Actions never throw to the client on validation
 * failure — only on true programmer error (misconfigured env, etc.).
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type AuthActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in out)) {
      out[key] = issue.message;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function localePrefix(locale: string | null | undefined): string {
  return locale === 'en' ? '/en' : '/ar';
}

// ---------------------------------------------------------------------------
// EMAIL — Sign up
// ---------------------------------------------------------------------------

export async function signUpWithEmail(formData: FormData): Promise<AuthActionResult> {
  const parsed = SignUpEmailSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    display_name: formData.get('display_name'),
    locale: formData.get('locale') ?? 'ar',
    terms: formData.get('terms'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation_failed', fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const { email, password, display_name, locale } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppOrigin()}${localePrefix(locale)}/auth-callback`,
      data: {
        display_name,
        locale,
        country_code: 'KW',
      },
    },
  });

  if (error) {
    // Server log — raw Supabase error is surfaced to server console only.
    console.error('[auth] signUpWithEmail supabase error:', {
      message: error.message,
      status: error.status,
      code: (error as { code?: string }).code,
    });
    // Normalize common Supabase error codes to our i18n keys.
    if (/already registered|already exists/i.test(error.message)) {
      return { ok: false, error: 'email_already_registered' };
    }
    if (/weak password|insufficient/i.test(error.message)) {
      return { ok: false, error: 'password_too_weak' };
    }
    return { ok: false, error: 'signup_failed' };
  }

  return { ok: true, message: 'check_email' };
}

// ---------------------------------------------------------------------------
// EMAIL — Sign in
// ---------------------------------------------------------------------------

export async function signInWithEmail(formData: FormData): Promise<AuthActionResult> {
  const parsed = SignInEmailSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation_failed', fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (/invalid login|invalid credentials/i.test(error.message)) {
      return { ok: false, error: 'invalid_credentials' };
    }
    if (/email not confirmed/i.test(error.message)) {
      return { ok: false, error: 'email_not_confirmed' };
    }
    return { ok: false, error: 'signin_failed' };
  }

  revalidatePath('/', 'layout');
  const locale = (formData.get('locale') as string) ?? 'ar';
  redirect(localePrefix(locale));
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOut(formData?: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  const locale = (formData?.get('locale') as string) ?? 'ar';
  redirect(localePrefix(locale));
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(formData: FormData): Promise<AuthActionResult> {
  const parsed = ResetPasswordRequestSchema.safeParse({
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'validation_failed', fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const locale = (formData.get('locale') as string) ?? 'ar';
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppOrigin()}${localePrefix(locale)}/reset-password/confirm`,
  });

  // Intentionally don't leak whether the email exists — return ok in both cases.
  if (error) {
    // Log server-side for observability; client sees generic success.
    console.error('[auth] requestPasswordReset error:', error.message);
  }

  return { ok: true, message: 'reset_email_sent' };
}

export async function updatePassword(formData: FormData): Promise<AuthActionResult> {
  const parsed = ResetPasswordConfirmSchema.safeParse({
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'validation_failed', fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { ok: false, error: 'update_password_failed' };
  }

  return { ok: true, message: 'password_updated' };
}

// ---------------------------------------------------------------------------
// PHONE — Sprint 1 stubs (real implementation in Sprint 6)
// ---------------------------------------------------------------------------

export async function signUpWithPhone(_formData: FormData): Promise<AuthActionResult> {
  return { ok: false, error: 'phone_auth_not_available' };
}

export async function signInWithPhone(_formData: FormData): Promise<AuthActionResult> {
  return { ok: false, error: 'phone_auth_not_available' };
}

export async function verifyPhoneOtp(_formData: FormData): Promise<AuthActionResult> {
  return { ok: false, error: 'phone_auth_not_available' };
}
