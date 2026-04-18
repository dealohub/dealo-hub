import { z } from 'zod';

/**
 * Profile validators. i18n keys use underscores only — next-intl reserves `.`.
 */

// Reserved handles (routes, trademarks, admin paths) — rejected server-side.
export const RESERVED_HANDLES = new Set<string>([
  'admin',
  'administrator',
  'root',
  'dealo',
  'dealohub',
  'support',
  'help',
  'api',
  'auth',
  'me',
  'edit',
  'profile',
  'settings',
  'test',
  'signup',
  'signin',
  'login',
  'logout',
  'register',
  'about',
  'privacy',
  'terms',
  'mail',
  'www',
  'kw',
  'sa',
  'ae',
  'bh',
  'qa',
  'om',
]);

export const HandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, { message: 'handle_invalid_format' })
  .refine(h => !h.startsWith('_') && !h.endsWith('_'), { message: 'handle_underscore_edges' })
  .refine(h => !RESERVED_HANDLES.has(h), { message: 'handle_reserved' });

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'name_too_short' })
  .max(50, { message: 'name_too_long' });

export const BioSchema = z
  .string()
  .trim()
  .max(300, { message: 'bio_too_long' })
  .optional()
  .nullable();

export const LocaleSchema = z.enum(['ar', 'en']);

/** Optional handle — empty string is treated as "no handle". */
const OptionalHandleSchema = z
  .preprocess(v => (typeof v === 'string' && v.trim() === '' ? null : v), HandleSchema.nullable());

export const ProfileUpdateSchema = z.object({
  display_name: DisplayNameSchema,
  handle: OptionalHandleSchema,
  bio: z.preprocess(v => (typeof v === 'string' && v.trim() === '' ? null : v), BioSchema),
  preferred_locale: LocaleSchema,
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// Avatar file constraints — mirrors the bucket's storage policy.
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME = ['image/webp', 'image/jpeg', 'image/png'] as const;

export const AvatarFileSchema = z.object({
  size: z.number().max(AVATAR_MAX_BYTES, { message: 'avatar_too_large' }),
  type: z.enum(AVATAR_ALLOWED_MIME, { message: 'avatar_invalid_format' }),
});

export const HandleCheckSchema = z.object({
  handle: HandleSchema,
});
