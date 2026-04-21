import { z } from 'zod';

/**
 * Per-step Zod schemas for the listing creation wizard.
 *
 * Cross-cutting rules (Sprint 2 filters from COMPETITOR-DUBIZZLE.md §12):
 *   - `assertNoPhoneInText` rejects phone numbers anywhere in title/description.
 *   - `assertNoCounterfeitTerms` rejects "1st copy" / "replica" / "تقليد" / etc.
 *     (Luxury-specific — only applied when the category subtree requires it.)
 *
 * Error messages are i18n keys (underscores only, per next-intl rules).
 */

// ---------------------------------------------------------------------------
// Sprint 2 Filter A — phone-in-text reject
// ---------------------------------------------------------------------------

const PHONE_PATTERNS: ReadonlyArray<RegExp> = [
  /\+?965[\s-]?\d{7,8}/, // +965 12345678
  /\+?(966|971|973|974|968)[\s-]?\d{7,9}/, // other GCC for Phase 2
  /\b\d{8}\b/, // bare 8-digit Kuwait mobile
  // Note: we deliberately do NOT match bare 7-digit sequences. Kuwait
  // mobile numbers are 8 digits; 7-digit runs are almost always
  // reference codes, order numbers, or prices. Catching them was a
  // false-positive generator (caught by validators.test.ts 2026-04-21).
  /(?:^|[^a-z0-9])(?:call|اتصل|راسل|wa\.?me|whatsapp|واتس|واتساب)\s*[:.\-]?\s*\+?\d/i,
];

export function containsPhoneNumber(text: string): boolean {
  return PHONE_PATTERNS.some(re => re.test(text));
}

// ---------------------------------------------------------------------------
// Sprint 2 Filter B — luxury counterfeit terms (applied at luxury subtree)
// ---------------------------------------------------------------------------

const COUNTERFEIT_TERMS: ReadonlyArray<string> = [
  '1st copy',
  'first copy',
  'master copy',
  'mirror copy',
  'aaa copy',
  'super copy',
  'replica',
  'reproduction',
  'knockoff',
  'knock-off',
  'fake',
  'counterfeit',
  'تقليد',
  'مستنسخ',
  'نسخة طبق الأصل',
  'كوبي',
  'ماستر كوبي',
  'كلاس وان',
  'درجة أولى',
];

export function containsCounterfeitTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return COUNTERFEIT_TERMS.some(term => lower.includes(term));
}

// ---------------------------------------------------------------------------
// Phase 4a Filter C — discriminatory-wording reject (applied at properties)
// ---------------------------------------------------------------------------
//
// Kuwait property classifieds commonly carry filters like "Non-Arabs Only",
// "Bachelors only", "For Filipinos only" — observed live on Dubizzle KW
// 2026-04-21 (see planning/PHASE-4A-AUDIT.md §12 Evidence A). Dealo Hub
// rejects these at submit time. Servers as a trust signal + Kuwait-wide
// fair-housing posture.
//
// The regex set covers:
//   • Nationality / ethnicity (only|no X · X only — EN + AR)
//   • Religion (same patterns, locked list of religions)
//   • Marital / family status (bachelors, singles, families, students)
//   • Arabic negation forms (لا يوجد / لا يقبل / ممنوع + category)
//
// Word boundaries (\b) prevent false positives like "bachelor's pad"
// matching "bachelors only". A second-pass GPT-4o-mini check (not
// shipped in Phase 4a — Phase 4b adds it) catches obfuscated wording.
//
// The rejection UX (consumer-facing) lives in the submit form — this
// helper returns the boolean trigger.

const DISCRIMINATORY_PATTERNS: ReadonlyArray<RegExp> = [
  // English — nationality / ethnicity / religion: "only|no X" and "X only"
  /\b(only|no)\s+(arabs?|asians?|indians?|pakistan(i|is)|filipin(a|o|os)?|nepal(i|is)?|sri[- ]lankan|egyptians?|syrians?|iraqis?|lebanese|iranians?|africans?|muslims?|christians?|hindus?|sikhs?)\b/i,
  /\b(arabs?|asians?|indians?|pakistanis?|filipinos?|nepalis?|sri[- ]lankans?|egyptians?|syrians?|lebanese|iranians?|africans?|muslims?|christians?|hindus?|sikhs?)\s+only\b/i,

  // English — marital / family status: bachelors, singles, families, students, couples
  /\b(only|no)\s+(bachelors?|singles?|families|couples?|students?)\b/i,
  /\b(bachelors?|singles?|families|couples?|students?)\s+only\b/i,

  // English — explicit preference language
  /\bpreference\s+(?:to|for)\s+(arabs?|asians?|indians?|filipinos?|muslims?|christians?)\b/i,
  /\b(asians?|indians?|filipinos?|arabs?|muslims?|christians?)\s+preferred\b/i,

  // Arabic — nationality / ethnicity (لا يوجد / لا يقبل / ممنوع + group)
  /(لا\s+(يوجد|يقبل|نقبل)|ممنوع)\s+(عرب|آسيويين|هنود|فلبينيين|نيباليين|سوريين|مصريين|عراقيين|لبنانيين|إيرانيين|أفارقة|باكستانيين)/,
  /(عرب|آسيويين|هنود|فلبينيين|نيباليين|سوريين|مصريين|عراقيين|لبنانيين)\s+فقط/,

  // Arabic — marital
  /(لا\s+(يوجد|يقبل)|ممنوع)\s+(عزاب|عائلات|طلاب|أزواج)/,
  /(عزاب|عائلات|طلاب|أزواج)\s+فقط/,

  // Arabic — religion
  /(لا\s+(يوجد|يقبل)|ممنوع)\s+(مسلمين|مسيحيين|هندوس|سيخ)/,
  /(مسلمين|مسيحيين|هندوس|سيخ)\s+فقط/,
];

export function containsDiscriminatoryWording(text: string): boolean {
  return DISCRIMINATORY_PATTERNS.some(re => re.test(text));
}

// ---------------------------------------------------------------------------
// Step 1 — category
// ---------------------------------------------------------------------------

export const Step1CategorySchema = z.object({
  category_id: z
    .number({ invalid_type_error: 'category_required' })
    .int()
    .positive({ message: 'category_required' }),
  subcategory_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});
export type Step1CategoryInput = z.infer<typeof Step1CategorySchema>;

// ---------------------------------------------------------------------------
// Step 2 — media (images + optional video)
// ---------------------------------------------------------------------------

const ImageUrlSchema = z.string().url();

export function makeStep2MediaSchema(opts: {
  minImages: number; // 5 default, 8 luxury
  requireVideo: boolean;
}) {
  return z.object({
    image_urls: z
      .array(ImageUrlSchema)
      .min(opts.minImages, { message: 'images_too_few' })
      .max(10, { message: 'images_too_many' }),
    video_url: opts.requireVideo
      ? z.string().url({ message: 'video_required' })
      : z.string().url().optional().nullable(),
  });
}

// ---------------------------------------------------------------------------
// Step 3 — details (title + description + condition + brand/model)
// ---------------------------------------------------------------------------

const TitleSchema = z
  .string()
  .trim()
  .min(5, { message: 'title_too_short' })
  .max(120, { message: 'title_too_long' })
  .refine(v => !containsPhoneNumber(v), { message: 'phone_not_allowed_in_text' });

const DescriptionSchema = z
  .string()
  .trim()
  .min(10, { message: 'description_too_short' })
  .max(5000, { message: 'description_too_long' })
  .refine(v => !containsPhoneNumber(v), { message: 'phone_not_allowed_in_text' });

export const ConditionEnum = z.enum([
  'new',
  'new_with_tags',
  'like_new',
  'excellent_used',
  'good_used',
  'fair_used',
]);
export type Condition = z.infer<typeof ConditionEnum>;

export const Step3DetailsSchema = z.object({
  title: TitleSchema,
  description: DescriptionSchema,
  condition: ConditionEnum,
  brand: z.string().trim().max(100).optional().nullable(),
  model: z.string().trim().max(100).optional().nullable(),
});
export type Step3DetailsInput = z.infer<typeof Step3DetailsSchema>;

/** Luxury-tier extension: also reject counterfeit terms in title/description/brand. */
export const Step3DetailsLuxurySchema = Step3DetailsSchema.superRefine((data, ctx) => {
  const combined = [data.title, data.description, data.brand ?? '', data.model ?? ''].join(' ');
  if (containsCounterfeitTerm(combined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'counterfeit_term_not_allowed',
      path: ['description'],
    });
  }
});

/**
 * Properties-tier extension (Filter C): rejects discriminatory wording
 * in title + description. Dealo Doctrine pillar P3. Applied to all
 * real-estate sub-categories (property-for-rent, property-for-sale,
 * rooms-for-rent, land, etc.).
 *
 * Submit-form UX on rejection:
 *   "Our policy: describe the property, not who can live in it.
 *    If you mean 'quiet building' or 'working professionals welcome',
 *    write that instead."
 *
 * Reference: planning/PHASE-4A-AUDIT.md §6 (Filter C spec)
 */
export const Step3DetailsPropertiesSchema = Step3DetailsSchema.superRefine(
  (data, ctx) => {
    const combined = [data.title, data.description].join(' ');
    if (containsDiscriminatoryWording(combined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'discriminatory_wording_not_allowed',
        path: ['description'],
      });
    }
  },
);

// ---------------------------------------------------------------------------
// Step 4 — price
// ---------------------------------------------------------------------------

export const PriceModeEnum = z.enum(['fixed', 'negotiable', 'best_offer']);
export type PriceMode = z.infer<typeof PriceModeEnum>;

export const Step4PriceSchema = z
  .object({
    price_minor_units: z
      .number({ invalid_type_error: 'price_required' })
      .int()
      .positive({ message: 'price_required' }),
    currency_code: z.literal('KWD'),
    price_mode: PriceModeEnum,
    min_offer_minor_units: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.price_mode !== 'best_offer' && data.min_offer_minor_units != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min_offer_only_for_best_offer',
        path: ['min_offer_minor_units'],
      });
    }
    if (
      data.price_mode === 'best_offer' &&
      data.min_offer_minor_units != null &&
      data.min_offer_minor_units > data.price_minor_units
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min_offer_must_be_less_than_price',
        path: ['min_offer_minor_units'],
      });
    }
  });
export type Step4PriceInput = z.infer<typeof Step4PriceSchema>;

// ---------------------------------------------------------------------------
// Step 5 — location
// ---------------------------------------------------------------------------

export const Step5LocationSchema = z.object({
  country_code: z.literal('KW'),
  city_id: z
    .number({ invalid_type_error: 'city_required' })
    .int()
    .positive({ message: 'city_required' }),
  area_id: z.number().int().positive().optional().nullable(),
});
export type Step5LocationInput = z.infer<typeof Step5LocationSchema>;

// ---------------------------------------------------------------------------
// Step 6 — delivery
// ---------------------------------------------------------------------------

export const DeliveryOptionEnum = z.enum(['pickup', 'seller_delivers', 'buyer_ships']);
export type DeliveryOption = z.infer<typeof DeliveryOptionEnum>;

export const Step6DeliverySchema = z.object({
  delivery_options: z
    .array(DeliveryOptionEnum)
    .min(1, { message: 'delivery_required' }),
});
export type Step6DeliveryInput = z.infer<typeof Step6DeliverySchema>;

// ---------------------------------------------------------------------------
// Step 7 — authenticity (luxury only)
// ---------------------------------------------------------------------------

export const Step7AuthenticitySchema = z.object({
  authenticity_confirmed: z
    .boolean()
    .refine(v => v === true, { message: 'authenticity_required' }),
  has_receipt: z.boolean().default(false),
  serial_number: z.string().trim().max(100).optional().nullable(),
});
export type Step7AuthenticityInput = z.infer<typeof Step7AuthenticitySchema>;

// ---------------------------------------------------------------------------
// Full publish schema — runs server-side immediately before INSERT into `listings`.
// ---------------------------------------------------------------------------

export const PublishSchema = z.object({
  category_id: z.number().int().positive(),
  subcategory_id: z.number().int().positive().optional().nullable(),
  title: TitleSchema,
  description: DescriptionSchema,
  condition: ConditionEnum,
  brand: z.string().trim().max(100).optional().nullable(),
  model: z.string().trim().max(100).optional().nullable(),
  price_minor_units: z.number().int().positive(),
  currency_code: z.literal('KWD'),
  price_mode: PriceModeEnum,
  min_offer_minor_units: z.number().int().positive().optional().nullable(),
  country_code: z.literal('KW'),
  city_id: z.number().int().positive(),
  area_id: z.number().int().positive().optional().nullable(),
  delivery_options: z.array(DeliveryOptionEnum).min(1),
  authenticity_confirmed: z.boolean().default(false),
  has_receipt: z.boolean().default(false),
  serial_number: z.string().trim().max(100).optional().nullable(),
  image_urls: z.array(ImageUrlSchema).min(5).max(10),
  video_url: z.string().url().optional().nullable(),
});
export type PublishInput = z.infer<typeof PublishSchema>;
