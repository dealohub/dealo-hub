/**
 * Phase 8a — Home Services validators.
 *
 * Three Zod schema groups:
 *   1. ServiceFieldsSchema — the 14-field category_fields JSONB shape
 *      that lives on `listings` for services. Enforces the P7 "no
 *      call-for-quote" rule via .refine().
 *   2. Chat-primitive payload schemas — QuoteRequestPayloadSchema,
 *      QuoteResponsePayloadSchema, BookingProposalPayloadSchema,
 *      CompletionMarkPayloadSchema. These gate what can be written to
 *      messages.payload for each kind.
 *   3. Safety filter — containsPhoneOrEmailPattern() for P4 (chat-only
 *      invariant). Reused by quote_request / quote_response writers.
 *
 * Mirrors pattern from src/lib/electronics/validators.ts.
 *
 * Doctrine references:
 *   [P1] src/lib/services/types.ts — profile is the atomic unit
 *   [P3] 3-quote flow primitives — §2 of PHASE-8A-HOME-SERVICES.md
 *   [P4] Chat-only + structured kinds
 *   [P7] Transparent pricing — no call-for-quote
 */

import { z } from 'zod';
import {
  TASK_TYPES,
  KW_GOVERNORATES,
  PROVIDER_LANGUAGES,
  type TaskType,
  type KwGovernorate,
  type ProviderLanguage,
  type PriceMode,
  type AvailabilitySummary,
} from './types';

// ---------------------------------------------------------------------------
// Zod sub-schemas — enum aliases
// ---------------------------------------------------------------------------

const TaskTypeSchema = z.enum(TASK_TYPES as readonly [TaskType, ...TaskType[]]);
const KwGovernorateSchema = z.enum(KW_GOVERNORATES as readonly [KwGovernorate, ...KwGovernorate[]]);
const ProviderLanguageSchema = z.enum(PROVIDER_LANGUAGES as readonly [ProviderLanguage, ...ProviderLanguage[]]);

const PriceModeSchema = z.enum(['hourly', 'fixed', 'hybrid'] satisfies [PriceMode, PriceMode, PriceMode]);

const AvailabilitySummarySchema = z.enum([
  'daytime_weekdays', 'daytime_weekends', 'evenings', 'flexible',
] satisfies [AvailabilitySummary, AvailabilitySummary, AvailabilitySummary, AvailabilitySummary]);

// ---------------------------------------------------------------------------
// Section 1 — ServiceFields schema (category_fields JSONB)
// ---------------------------------------------------------------------------

export const ServiceFieldsSchema = z
  .object({
    // Atomic unit (P1). Client resolves this when creating a listing.
    provider_profile_id: z.string().uuid(),

    // Task scope (P1 + doctrine decision #6).
    task_type: TaskTypeSchema,

    // Serving map — light duplicate of service_areas_served relation; we
    // keep governorate on the JSONB for cheap hub-level filtering without
    // a join. Area-level filtering uses the relation table.
    served_governorates: z
      .array(KwGovernorateSchema)
      .min(1, 'Provider must declare at least 1 served governorate')
      .max(6, 'Kuwait only has 6 governorates'),

    // Pricing (P7) — validated cross-field by .refine() below.
    price_mode: PriceModeSchema,
    hourly_rate_minor_units: z.number().int().positive().optional(),
    min_hours: z.number().int().min(1).max(12).optional(),
    fixed_price_minor_units: z.number().int().positive().optional(),

    // Capacity + availability (lightweight).
    availability_summary: AvailabilitySummarySchema,
    team_size: z.number().int().min(1).max(20).default(1),
    supplies_included: z.boolean().default(false),
    spoken_languages: z
      .array(ProviderLanguageSchema)
      .min(1, 'Provider must speak at least 1 language'),
    years_experience: z.number().int().min(0).max(60).optional(),

    // Read-side aggregates — populated by the system on insert, never
    // written by sellers. Validated here so the schema round-trips cleanly.
    completed_bookings_count: z.number().int().min(0).default(0),
    rating_avg: z.number().min(1).max(5).nullable().default(null),
    rating_count: z.number().int().min(0).default(0),
  })
  .refine(
    // P7 — price_mode must match populated price fields.
    (f) => {
      if (f.price_mode === 'hourly') {
        return f.hourly_rate_minor_units != null && f.min_hours != null;
      }
      if (f.price_mode === 'fixed') {
        return f.fixed_price_minor_units != null;
      }
      // hybrid: needs BOTH hourly tuple AND fixed
      return (
        f.hourly_rate_minor_units != null &&
        f.min_hours != null &&
        f.fixed_price_minor_units != null
      );
    },
    {
      message:
        'price_mode requires matching price fields populated (hourly → hourly_rate_minor_units + min_hours; fixed → fixed_price_minor_units; hybrid → both)',
      path: ['price_mode'],
    },
  );

export type ServiceFields = z.infer<typeof ServiceFieldsSchema>;

/**
 * Validate a raw category_fields JSONB from the DB against the schema.
 * Used by queries.ts when reading listings + by publishListing when
 * writing.
 */
export function validateServiceFieldsRaw(
  raw: unknown,
): z.SafeParseReturnType<unknown, ServiceFields> {
  return ServiceFieldsSchema.safeParse(raw);
}

// ---------------------------------------------------------------------------
// Section 2 — Chat-primitive payload schemas (Phase 8a P4)
// ---------------------------------------------------------------------------

const IsoDateTimeString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid ISO datetime');

export const QuoteRequestPayloadSchema = z.object({
  sub_cat: z.literal('home-services'),
  task_type: TaskTypeSchema,
  bedrooms: z.number().int().min(0).max(10).optional(),
  area_m2: z.number().int().min(10).max(2000).optional(),
  preferred_date_window: z.string().min(1).max(60),
  preferred_time_window: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  notes: z.string().max(1000).optional(),
  job_governorate: KwGovernorateSchema,
});

export const QuoteResponsePayloadSchema = z
  .object({
    price_minor_units: z.number().int().positive(),
    price_mode: z.enum(['fixed', 'hourly_x_hours']),
    hours: z.number().int().min(1).max(24).optional(),
    includes: z.array(z.string().min(1).max(60)).max(10).default([]),
    earliest_slot: IsoDateTimeString,
    expires_at: IsoDateTimeString,
  })
  .refine(
    (p) => {
      if (p.price_mode === 'hourly_x_hours') return p.hours != null;
      return true;
    },
    { message: 'hourly_x_hours price_mode requires hours', path: ['hours'] },
  )
  .refine(
    // expires_at must be strictly after earliest_slot; both must be future-ish.
    (p) => Date.parse(p.expires_at) > Date.parse(p.earliest_slot),
    { message: 'expires_at must be after earliest_slot', path: ['expires_at'] },
  );

export const BookingProposalPayloadSchema = z
  .object({
    slot_start_at: IsoDateTimeString,
    slot_end_at: IsoDateTimeString,
    area_id: z.number().int().positive(),
    estimated_total_minor_units: z.number().int().positive(),
    guarantee_applies: z.boolean(),
  })
  .refine(
    (p) => Date.parse(p.slot_end_at) > Date.parse(p.slot_start_at),
    { message: 'slot_end_at must be after slot_start_at', path: ['slot_end_at'] },
  );

export const CompletionMarkPayloadSchema = z.object({
  booking_id: z.number().int().positive(),
  completed_at: IsoDateTimeString,
});

// ---------------------------------------------------------------------------
// Section 3 — Safety filter: phone/email leak detection (P4 enforcement)
// ---------------------------------------------------------------------------
//
// Any quote_request / quote_response / booking_proposal that embeds a
// phone number or email in free-text fields MUST be rejected at the
// server-action layer. This is the last line of DECISIONS.md #2
// (chat-only) for services primitives.
//
// We're intentionally broad: better to false-positive and force the
// user to rephrase than to leak contact info. Tightening via real-world
// data comes in 8b.

/**
 * Matches Kuwait mobile numbers, international E.164, and common
 * "call me on..." patterns. Accepts digits separated by spaces,
 * hyphens, dots, parens.
 */
const PHONE_PATTERNS: RegExp[] = [
  // 8-digit Kuwait mobiles (5/6/9 prefix), with optional +965 / 00965
  /(?:\+?965|00965)?[\s\-.()]?[569]\d[\s\-.()]?\d{2}[\s\-.()]?\d{3}/,
  // Generic international E.164: + then 7-15 digits, spaces/dashes allowed
  /\+\d[\d\s\-.()]{6,16}\d/,
  // 8+ digits in a row (with optional separators) — catches "call 66984597"
  /(?:\d[\s\-.()]?){7,}\d/,
  // Arabic-Indic digits (٠-٩) — same 8-digit pattern
  /(?:[٠-٩][\s\-.()]?){7,}[٠-٩]/,
];

const EMAIL_PATTERN = /[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i;

/**
 * Broad contact-info detector. Returns true if the text looks like it
 * contains a phone or email.
 *
 * Intentionally broad — P4 chat-only invariant is load-bearing for trust.
 * False-positive cost: user gets prompted to rephrase.
 * False-negative cost: buyer sees phone, churns off-platform, no
 *                      re-engagement, dispute guarantee void.
 */
export function containsPhoneOrEmailPattern(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (EMAIL_PATTERN.test(lower)) return true;
  for (const rx of PHONE_PATTERNS) {
    if (rx.test(text)) return true;
  }
  return false;
}

/**
 * Inspect a QuoteRequest/QuoteResponse payload for contact-info leaks.
 * Focuses on free-text fields only (notes, includes). Structured fields
 * (price, hours, ids) are safe by type.
 */
export function quoteRequestLeaksContact(p: {
  notes?: string | null;
}): boolean {
  return containsPhoneOrEmailPattern(p.notes ?? null);
}

export function quoteResponseLeaksContact(p: {
  includes: string[];
}): boolean {
  for (const item of p.includes) {
    if (containsPhoneOrEmailPattern(item)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Section 4 — Booking state-machine helper (used by queries + tests)
// ---------------------------------------------------------------------------

export type BookingStatus =
  | 'proposed'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'disputed';

/**
 * Legal state transitions for service_bookings.status. Used both by
 * server actions and by tests as the single source of truth.
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, ReadonlyArray<BookingStatus>> = {
  proposed: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'disputed'],
  completed: ['disputed'], // disputes can arise after marking complete
  cancelled: [],           // terminal
  disputed: ['completed', 'cancelled'], // admin-resolvable
};

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
