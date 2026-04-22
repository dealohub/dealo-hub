import { describe, it, expect } from 'vitest';
import {
  ServiceFieldsSchema,
  validateServiceFieldsRaw,
  QuoteRequestPayloadSchema,
  QuoteResponsePayloadSchema,
  BookingProposalPayloadSchema,
  CompletionMarkPayloadSchema,
  containsPhoneOrEmailPattern,
  quoteRequestLeaksContact,
  quoteResponseLeaksContact,
  canTransitionBooking,
  type ServiceFields,
  type BookingStatus,
} from './validators';

/**
 * Phase 8a — services validators test suite.
 *
 * Sections match the file layout:
 *   1. ServiceFields schema (14-field JSONB + P7 invariant)
 *   2. Chat-primitive payload schemas (quote_request / quote_response /
 *      booking_proposal / completion_mark)
 *   3. Phone/email leak detector (P4 chat-only invariant)
 *   4. Booking state machine
 *
 * Target: ≥40 assertions (matching the discipline set by
 * src/lib/electronics/validators.test.ts = 109 tests).
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function validHourlyFields(overrides: Partial<ServiceFields> = {}): any {
  return {
    provider_profile_id: '11111111-1111-1111-1111-111111111111',
    task_type: 'home_cleaning_one_off',
    served_governorates: ['hawalli', 'capital'],
    price_mode: 'hourly',
    hourly_rate_minor_units: 3000, // 3 KWD/hr (minor)
    min_hours: 3,
    availability_summary: 'flexible',
    team_size: 2,
    supplies_included: true,
    spoken_languages: ['ar', 'en'],
    years_experience: 5,
    completed_bookings_count: 0,
    rating_avg: null,
    rating_count: 0,
    ...overrides,
  };
}

function validFixedFields(overrides: Partial<ServiceFields> = {}): any {
  return {
    provider_profile_id: '22222222-2222-2222-2222-222222222222',
    task_type: 'handyman_ikea_assembly',
    served_governorates: ['hawalli'],
    price_mode: 'fixed',
    fixed_price_minor_units: 15000, // 15 KWD for the task
    availability_summary: 'daytime_weekdays',
    team_size: 1,
    supplies_included: false,
    spoken_languages: ['ar'],
    completed_bookings_count: 12,
    rating_avg: 4.7,
    rating_count: 8,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Section 1 — ServiceFields schema
// ---------------------------------------------------------------------------

describe('ServiceFieldsSchema — happy paths', () => {
  it('accepts an hourly-priced cleaning listing', () => {
    const r = ServiceFieldsSchema.safeParse(validHourlyFields());
    expect(r.success).toBe(true);
  });

  it('accepts a fixed-priced handyman listing', () => {
    const r = ServiceFieldsSchema.safeParse(validFixedFields());
    expect(r.success).toBe(true);
  });

  it('accepts hybrid pricing with both hourly and fixed populated', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({
        price_mode: 'hybrid',
        fixed_price_minor_units: 25000,
      }),
    );
    expect(r.success).toBe(true);
  });

  it('fills defaults (team_size=1, supplies_included=false, aggregates=0/null)', () => {
    const input = {
      provider_profile_id: '33333333-3333-3333-3333-333333333333',
      task_type: 'home_cleaning_recurring',
      served_governorates: ['capital'],
      price_mode: 'hourly',
      hourly_rate_minor_units: 2500,
      min_hours: 4,
      availability_summary: 'flexible',
      spoken_languages: ['ar'],
    };
    const r = ServiceFieldsSchema.safeParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.team_size).toBe(1);
      expect(r.data.supplies_included).toBe(false);
      expect(r.data.completed_bookings_count).toBe(0);
      expect(r.data.rating_avg).toBeNull();
      expect(r.data.rating_count).toBe(0);
    }
  });

  it('validateServiceFieldsRaw passes through happy input', () => {
    const r = validateServiceFieldsRaw(validHourlyFields());
    expect(r.success).toBe(true);
  });
});

describe('ServiceFieldsSchema — P7 price invariant', () => {
  it('rejects hourly without hourly_rate_minor_units', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ hourly_rate_minor_units: undefined }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects hourly without min_hours', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ min_hours: undefined }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects fixed without fixed_price_minor_units', () => {
    const r = ServiceFieldsSchema.safeParse(
      validFixedFields({ fixed_price_minor_units: undefined }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects hybrid missing hourly tuple', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({
        price_mode: 'hybrid',
        fixed_price_minor_units: 10000,
        hourly_rate_minor_units: undefined,
      }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects hybrid missing fixed_price', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ price_mode: 'hybrid' }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects negative hourly rate', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ hourly_rate_minor_units: -500 }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects min_hours = 0', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ min_hours: 0 }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects min_hours > 12', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ min_hours: 13 }),
    );
    expect(r.success).toBe(false);
  });
});

describe('ServiceFieldsSchema — governorate + language + task_type enums', () => {
  it('rejects empty served_governorates', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ served_governorates: [] }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects too many served_governorates (> 6)', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({
        served_governorates: [
          'hawalli', 'capital', 'ahmadi', 'farwaniya',
          'mubarak_al_kabeer', 'jahra',
          'jahra' as any, // duplicate still counts as 7
        ],
      }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects invalid governorate slug', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ served_governorates: ['salmiya' as any] }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects empty spoken_languages', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ spoken_languages: [] }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects invalid spoken_language code', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ spoken_languages: ['fr' as any] }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects unknown task_type (scope gate for doctrine §6)', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ task_type: 'plumbing' as any }),
    );
    expect(r.success).toBe(false);
  });

  it('accepts all 8 task_type values', () => {
    const tasks = [
      'home_cleaning_one_off',
      'home_cleaning_recurring',
      'handyman_ikea_assembly',
      'handyman_tv_mount',
      'handyman_shelf_hang',
      'handyman_furniture_move',
      'handyman_basic_painting',
      'handyman_other',
    ] as const;
    for (const t of tasks) {
      const r = ServiceFieldsSchema.safeParse(
        validHourlyFields({ task_type: t }),
      );
      expect(r.success, `task_type=${t}`).toBe(true);
    }
  });
});

describe('ServiceFieldsSchema — aggregates + years_experience bounds', () => {
  it('rejects rating_avg < 1', () => {
    const r = ServiceFieldsSchema.safeParse(
      validFixedFields({ rating_avg: 0.5 }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects rating_avg > 5', () => {
    const r = ServiceFieldsSchema.safeParse(
      validFixedFields({ rating_avg: 5.5 }),
    );
    expect(r.success).toBe(false);
  });

  it('accepts null rating_avg on new providers', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ rating_avg: null }),
    );
    expect(r.success).toBe(true);
  });

  it('rejects years_experience > 60 (sanity cap)', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ years_experience: 75 }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects team_size > 20', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ team_size: 50 }),
    );
    expect(r.success).toBe(false);
  });

  it('rejects non-UUID provider_profile_id', () => {
    const r = ServiceFieldsSchema.safeParse(
      validHourlyFields({ provider_profile_id: 'not-a-uuid' }),
    );
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Chat-primitive payload schemas
// ---------------------------------------------------------------------------

describe('QuoteRequestPayloadSchema', () => {
  it('accepts a minimal valid request', () => {
    const r = QuoteRequestPayloadSchema.safeParse({
      sub_cat: 'home-services',
      task_type: 'home_cleaning_one_off',
      preferred_date_window: 'this_week',
      preferred_time_window: 'morning',
      job_governorate: 'hawalli',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a full request with optional fields', () => {
    const r = QuoteRequestPayloadSchema.safeParse({
      sub_cat: 'home-services',
      task_type: 'home_cleaning_one_off',
      bedrooms: 3,
      area_m2: 150,
      preferred_date_window: '2026-05-01',
      preferred_time_window: 'afternoon',
      notes: 'Please bring own supplies.',
      job_governorate: 'capital',
    });
    expect(r.success).toBe(true);
  });

  it('rejects wrong sub_cat (doctrine §1 gate)', () => {
    const r = QuoteRequestPayloadSchema.safeParse({
      sub_cat: 'moving-storage',
      task_type: 'home_cleaning_one_off',
      preferred_date_window: 'this_week',
      preferred_time_window: 'morning',
      job_governorate: 'hawalli',
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid time_window', () => {
    const r = QuoteRequestPayloadSchema.safeParse({
      sub_cat: 'home-services',
      task_type: 'home_cleaning_one_off',
      preferred_date_window: 'this_week',
      preferred_time_window: 'midnight' as any,
      job_governorate: 'hawalli',
    });
    expect(r.success).toBe(false);
  });

  it('rejects notes > 1000 chars', () => {
    const r = QuoteRequestPayloadSchema.safeParse({
      sub_cat: 'home-services',
      task_type: 'handyman_other',
      preferred_date_window: 'this_week',
      preferred_time_window: 'flexible',
      job_governorate: 'hawalli',
      notes: 'x'.repeat(1001),
    });
    expect(r.success).toBe(false);
  });

  it('rejects bedrooms > 10', () => {
    const r = QuoteRequestPayloadSchema.safeParse({
      sub_cat: 'home-services',
      task_type: 'home_cleaning_one_off',
      preferred_date_window: 'this_week',
      preferred_time_window: 'morning',
      job_governorate: 'hawalli',
      bedrooms: 15,
    });
    expect(r.success).toBe(false);
  });
});

describe('QuoteResponsePayloadSchema', () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const further = new Date(Date.now() + 3 * 86400000).toISOString();

  it('accepts a fixed-price response', () => {
    const r = QuoteResponsePayloadSchema.safeParse({
      price_minor_units: 25000,
      price_mode: 'fixed',
      includes: ['supplies'],
      earliest_slot: future,
      expires_at: further,
    });
    expect(r.success).toBe(true);
  });

  it('accepts an hourly_x_hours response with hours', () => {
    const r = QuoteResponsePayloadSchema.safeParse({
      price_minor_units: 12000,
      price_mode: 'hourly_x_hours',
      hours: 4,
      includes: [],
      earliest_slot: future,
      expires_at: further,
    });
    expect(r.success).toBe(true);
  });

  it('rejects hourly_x_hours without hours', () => {
    const r = QuoteResponsePayloadSchema.safeParse({
      price_minor_units: 12000,
      price_mode: 'hourly_x_hours',
      includes: [],
      earliest_slot: future,
      expires_at: further,
    });
    expect(r.success).toBe(false);
  });

  it('rejects expires_at before earliest_slot', () => {
    const r = QuoteResponsePayloadSchema.safeParse({
      price_minor_units: 10000,
      price_mode: 'fixed',
      includes: [],
      earliest_slot: further,
      expires_at: future, // wrong way around
    });
    expect(r.success).toBe(false);
  });

  it('rejects negative price', () => {
    const r = QuoteResponsePayloadSchema.safeParse({
      price_minor_units: -100,
      price_mode: 'fixed',
      includes: [],
      earliest_slot: future,
      expires_at: further,
    });
    expect(r.success).toBe(false);
  });

  it('rejects more than 10 includes', () => {
    const r = QuoteResponsePayloadSchema.safeParse({
      price_minor_units: 10000,
      price_mode: 'fixed',
      includes: Array(11).fill('item'),
      earliest_slot: future,
      expires_at: further,
    });
    expect(r.success).toBe(false);
  });
});

describe('BookingProposalPayloadSchema', () => {
  const start = new Date(Date.now() + 86400000).toISOString();
  const end = new Date(Date.now() + 86400000 + 2 * 3600000).toISOString();

  it('accepts a valid proposal', () => {
    const r = BookingProposalPayloadSchema.safeParse({
      slot_start_at: start,
      slot_end_at: end,
      area_id: 42,
      estimated_total_minor_units: 15000,
      guarantee_applies: true,
    });
    expect(r.success).toBe(true);
  });

  it('rejects slot_end before slot_start', () => {
    const r = BookingProposalPayloadSchema.safeParse({
      slot_start_at: end,
      slot_end_at: start,
      area_id: 42,
      estimated_total_minor_units: 15000,
      guarantee_applies: true,
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid ISO datetime', () => {
    const r = BookingProposalPayloadSchema.safeParse({
      slot_start_at: 'not-a-date',
      slot_end_at: end,
      area_id: 42,
      estimated_total_minor_units: 15000,
      guarantee_applies: true,
    });
    expect(r.success).toBe(false);
  });
});

describe('CompletionMarkPayloadSchema', () => {
  it('accepts a valid mark', () => {
    const r = CompletionMarkPayloadSchema.safeParse({
      booking_id: 101,
      completed_at: new Date().toISOString(),
    });
    expect(r.success).toBe(true);
  });

  it('rejects booking_id = 0', () => {
    const r = CompletionMarkPayloadSchema.safeParse({
      booking_id: 0,
      completed_at: new Date().toISOString(),
    });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Phone/email leak detector (P4)
// ---------------------------------------------------------------------------

describe('containsPhoneOrEmailPattern', () => {
  it('returns false for empty/null/undefined', () => {
    expect(containsPhoneOrEmailPattern(null)).toBe(false);
    expect(containsPhoneOrEmailPattern(undefined)).toBe(false);
    expect(containsPhoneOrEmailPattern('')).toBe(false);
  });

  it('returns false for harmless text', () => {
    expect(containsPhoneOrEmailPattern('Please bring supplies')).toBe(false);
    expect(containsPhoneOrEmailPattern('عندي ٣ غرف')).toBe(false);
    expect(containsPhoneOrEmailPattern('Room 2, floor 5')).toBe(false);
  });

  it('catches Kuwait mobile numbers (8 digits starting 5/6/9)', () => {
    expect(containsPhoneOrEmailPattern('call me 66984597')).toBe(true);
    expect(containsPhoneOrEmailPattern('99337172')).toBe(true);
    expect(containsPhoneOrEmailPattern('55342155')).toBe(true);
  });

  it('catches +965 prefixed numbers', () => {
    expect(containsPhoneOrEmailPattern('+96566984597')).toBe(true);
    expect(containsPhoneOrEmailPattern('+965 6698 4597')).toBe(true);
    expect(containsPhoneOrEmailPattern('00965-66984597')).toBe(true);
  });

  it('catches international E.164', () => {
    expect(containsPhoneOrEmailPattern('+14155552671')).toBe(true);
    expect(containsPhoneOrEmailPattern('+44 20 7946 0958')).toBe(true);
  });

  it('catches phones with separators', () => {
    expect(containsPhoneOrEmailPattern('6698-4597')).toBe(true);
    expect(containsPhoneOrEmailPattern('669 84 597')).toBe(true);
    expect(containsPhoneOrEmailPattern('(669)84597')).toBe(true);
  });

  it('catches Arabic-Indic digits', () => {
    expect(containsPhoneOrEmailPattern('٦٦٩٨٤٥٩٧')).toBe(true);
    expect(containsPhoneOrEmailPattern('اتصل ٩٩٣٣٧١٧٢')).toBe(true);
  });

  it('catches email addresses', () => {
    expect(containsPhoneOrEmailPattern('email me at foo@bar.com')).toBe(true);
    expect(containsPhoneOrEmailPattern('ahmed.ali@domain.co.uk')).toBe(true);
    expect(containsPhoneOrEmailPattern('a_b@x.io')).toBe(true);
  });

  it('case-insensitive on emails', () => {
    expect(containsPhoneOrEmailPattern('MIXED@Case.COM')).toBe(true);
  });
});

describe('quoteRequestLeaksContact + quoteResponseLeaksContact', () => {
  it('flags phone in quote_request notes', () => {
    expect(quoteRequestLeaksContact({ notes: 'Call me 66984597' })).toBe(true);
  });

  it('clears clean quote_request notes', () => {
    expect(quoteRequestLeaksContact({ notes: 'I have 3 rooms' })).toBe(false);
    expect(quoteRequestLeaksContact({ notes: undefined })).toBe(false);
    expect(quoteRequestLeaksContact({ notes: null as any })).toBe(false);
  });

  it('flags email hidden in quote_response includes', () => {
    expect(
      quoteResponseLeaksContact({ includes: ['supplies', 'me@example.com'] }),
    ).toBe(true);
  });

  it('clears clean includes list', () => {
    expect(
      quoteResponseLeaksContact({
        includes: ['supplies', 'eco_friendly', 'own_transport'],
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Booking state machine
// ---------------------------------------------------------------------------

describe('canTransitionBooking', () => {
  it('allows proposed → confirmed', () => {
    expect(canTransitionBooking('proposed', 'confirmed')).toBe(true);
  });

  it('allows proposed → cancelled', () => {
    expect(canTransitionBooking('proposed', 'cancelled')).toBe(true);
  });

  it('rejects proposed → completed (must confirm first)', () => {
    expect(canTransitionBooking('proposed', 'completed')).toBe(false);
  });

  it('rejects proposed → disputed (must confirm first)', () => {
    expect(canTransitionBooking('proposed', 'disputed')).toBe(false);
  });

  it('allows confirmed → completed', () => {
    expect(canTransitionBooking('confirmed', 'completed')).toBe(true);
  });

  it('allows confirmed → cancelled', () => {
    expect(canTransitionBooking('confirmed', 'cancelled')).toBe(true);
  });

  it('allows confirmed → disputed', () => {
    expect(canTransitionBooking('confirmed', 'disputed')).toBe(true);
  });

  it('allows completed → disputed (post-hoc dispute)', () => {
    expect(canTransitionBooking('completed', 'disputed')).toBe(true);
  });

  it('blocks completed → anything else', () => {
    expect(canTransitionBooking('completed', 'proposed')).toBe(false);
    expect(canTransitionBooking('completed', 'confirmed')).toBe(false);
    expect(canTransitionBooking('completed', 'cancelled')).toBe(false);
  });

  it('marks cancelled as terminal', () => {
    for (const to of [
      'proposed', 'confirmed', 'completed', 'disputed',
    ] as BookingStatus[]) {
      expect(canTransitionBooking('cancelled', to)).toBe(false);
    }
  });

  it('allows admin resolution of disputed', () => {
    expect(canTransitionBooking('disputed', 'completed')).toBe(true);
    expect(canTransitionBooking('disputed', 'cancelled')).toBe(true);
  });
});
