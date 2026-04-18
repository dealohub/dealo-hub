import { z } from 'zod';
import { isValidGCCPhone } from './phone';

/**
 * Auth form validators.
 * Error messages are i18n keys resolved via next-intl. Keys use underscores
 * only — next-intl reserves `.` for namespace nesting.
 */

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'email_invalid' })
  .max(254, { message: 'email_too_long' });

export const PasswordSchema = z
  .string()
  .min(10, { message: 'password_too_short' })
  .max(128, { message: 'password_too_long' })
  .regex(/[a-zA-Z]/, { message: 'password_needs_letter' })
  .regex(/\d/, { message: 'password_needs_number' });

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'name_too_short' })
  .max(50, { message: 'name_too_long' });

export const PhoneSchema = z
  .string()
  .trim()
  .refine(isValidGCCPhone, { message: 'phone_invalid' });

export const OtpSchema = z
  .string()
  .regex(/^\d{6}$/, { message: 'otp_invalid_format' });

export const LocaleSchema = z.enum(['ar', 'en']).default('ar');

// ---------- Form schemas ----------

export const SignUpEmailSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  display_name: DisplayNameSchema,
  locale: LocaleSchema,
  terms: z.string().optional().refine(v => v === 'on' || v === 'true', {
    message: 'terms_required',
  }),
});
export type SignUpEmailInput = z.infer<typeof SignUpEmailSchema>;

export const SignInEmailSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: 'password_required' }),
});
export type SignInEmailInput = z.infer<typeof SignInEmailSchema>;

export const SignUpPhoneSchema = z.object({
  phone: PhoneSchema,
  display_name: DisplayNameSchema,
  locale: LocaleSchema,
});
export type SignUpPhoneInput = z.infer<typeof SignUpPhoneSchema>;

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  otp: OtpSchema,
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResetPasswordRequestSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordConfirmSchema = z.object({
  password: PasswordSchema,
});
