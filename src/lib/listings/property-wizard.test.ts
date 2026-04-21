import { describe, it, expect } from 'vitest';
import { PublishSchema } from './validators';
import {
  PropertyFieldsDraftSchema,
  isPropertyFieldsDraftNonEmpty,
  validatePropertyFieldsRaw,
} from '@/lib/properties/validators';

/**
 * Property sell-wizard contract tests.
 *
 * These tests lock down the wire-up that enables a real seller to
 * publish a Properties listing via /sell:
 *
 *   1. PublishSchema must accept category_fields (JSONB blob) and
 *      default it to an empty object when omitted — non-property
 *      verticals (Automotive, Jobs, ...) shouldn't be forced to pass
 *      one to keep Step 3 unchanged.
 *
 *   2. PropertyFieldsDraftSchema is lenient by design (progressive
 *      wizard): partial payloads with only a subset of fields must
 *      pass. Full refinement happens at publish via
 *      validatePropertyFieldsRaw(raw, subCat).
 *
 *   3. The wizard → publish → listings.category_fields pipeline must
 *      refuse a real-estate publish when conditional-required fields
 *      are missing (e.g. sale without completion_status).
 *
 * Why a separate file: property-wizard.test.ts is about the join
 * between `listings/validators.ts` and `properties/validators.ts` —
 * both files already have per-module test suites; this one checks
 * the cross-module contract only.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MIN_PUBLISH_BASE = {
  category_id: 1,
  title: 'A wonderfully described listing that passes the filters',
  description: 'Long enough description for the 10-char minimum to pass.',
  condition: 'new' as const,
  price_minor_units: 1_000_000,
  currency_code: 'KWD' as const,
  price_mode: 'fixed' as const,
  country_code: 'KW' as const,
  city_id: 1,
  delivery_options: ['pickup' as const],
  image_urls: Array.from({ length: 5 }, (_, i) => `https://example.com/img${i}.jpg`),
};

// ---------------------------------------------------------------------------
// PublishSchema: category_fields is optional + defaults to {}
// ---------------------------------------------------------------------------

describe('PublishSchema — category_fields', () => {
  it('accepts the legacy non-property shape (no category_fields key)', () => {
    const result = PublishSchema.safeParse(MIN_PUBLISH_BASE);
    expect(result.success).toBe(true);
    if (result.success) {
      // Default applied
      expect(result.data.category_fields).toEqual({});
    }
  });

  it('accepts an explicit empty category_fields', () => {
    const result = PublishSchema.safeParse({
      ...MIN_PUBLISH_BASE,
      category_fields: {},
    });
    expect(result.success).toBe(true);
  });

  it('passes through a property-shaped blob unchanged (forward-compat)', () => {
    const fields = {
      property_type: 'villa',
      area_sqm: 450,
      bedrooms: 5,
      completion_status: 'ready',
      zoning_type: 'residential-private',
      amenities: ['central_ac', 'garden'],
    };
    const result = PublishSchema.safeParse({
      ...MIN_PUBLISH_BASE,
      category_fields: fields,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category_fields).toEqual(fields);
    }
  });

  it('does not accept non-object category_fields', () => {
    const result = PublishSchema.safeParse({
      ...MIN_PUBLISH_BASE,
      category_fields: 'not-an-object',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PropertyFieldsDraftSchema: lenient for progressive wizard
// ---------------------------------------------------------------------------

describe('PropertyFieldsDraftSchema', () => {
  it('accepts an empty object (seller just entered the step)', () => {
    const r = PropertyFieldsDraftSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('accepts a partial payload (type only, no area yet)', () => {
    const r = PropertyFieldsDraftSchema.safeParse({ property_type: 'villa' });
    expect(r.success).toBe(true);
  });

  it('accepts unknown keys for forward-compat (passthrough)', () => {
    const r = PropertyFieldsDraftSchema.safeParse({
      property_type: 'villa',
      future_key_v2: 'whatever',
    });
    expect(r.success).toBe(true);
  });

  it('still rejects structurally wrong values (bad enum)', () => {
    const r = PropertyFieldsDraftSchema.safeParse({
      property_type: 'castle', // not a valid PropertyType
    });
    expect(r.success).toBe(false);
  });

  it('still rejects out-of-range area_sqm', () => {
    const r = PropertyFieldsDraftSchema.safeParse({
      area_sqm: 1, // min is 10
    });
    expect(r.success).toBe(false);
  });
});

describe('isPropertyFieldsDraftNonEmpty', () => {
  it('returns false for null / undefined / {}', () => {
    expect(isPropertyFieldsDraftNonEmpty(null)).toBe(false);
    expect(isPropertyFieldsDraftNonEmpty(undefined)).toBe(false);
    expect(isPropertyFieldsDraftNonEmpty({})).toBe(false);
  });

  it('returns true once at least one key is set', () => {
    expect(isPropertyFieldsDraftNonEmpty({ property_type: 'villa' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Publish-time: wizard payload → validatePropertyFieldsRaw invariants
// ---------------------------------------------------------------------------

describe('publish-time property validation (wizard → actions)', () => {
  // These simulate what `publishListing` does: take the blob the
  // wizard wrote into listing_drafts.category_fields, combine it with
  // the sub-cat slug, and run the strict validator.

  it('accepts a complete sale villa (residential-private, ready)', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'villa',
        area_sqm: 550,
        completion_status: 'ready',
        zoning_type: 'residential-private',
        amenities: ['central_ac'],
      },
      'property-for-sale',
    );
    expect(r.success).toBe(true);
  });

  it('rejects a sale listing missing completion_status', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'villa',
        area_sqm: 550,
        zoning_type: 'residential-private',
      },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('completion_status');
    }
  });

  it('rejects a sale listing missing zoning_type (Law 74 gate)', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'villa',
        area_sqm: 550,
        completion_status: 'ready',
      },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('zoning_type');
    }
  });

  it('accepts a yearly rent apartment with cheques_count', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'apartment',
        area_sqm: 150,
        rent_period: 'yearly',
        cheques_count: 4,
      },
      'property-for-rent',
    );
    expect(r.success).toBe(true);
  });

  it('rejects a yearly rent missing cheques_count (GCC convention)', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'apartment',
        area_sqm: 150,
        rent_period: 'yearly',
      },
      'property-for-rent',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('cheques_count');
    }
  });

  it('accepts a chalet rent with min_stay_nights', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'chalet',
        area_sqm: 300,
        rent_period: 'daily',
        availability: { min_stay_nights: 2 },
      },
      'property-for-rent',
    );
    expect(r.success).toBe(true);
  });

  it('rejects a chalet rent missing availability.min_stay_nights', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'chalet',
        area_sqm: 300,
        rent_period: 'daily',
      },
      'property-for-rent',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('availability.min_stay_nights');
    }
  });

  it('accepts an off-plan sale with payment_plan + handover quarter', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'apartment',
        area_sqm: 120,
        completion_status: 'off_plan',
        zoning_type: 'investment',
        handover_expected_quarter: '2027-Q3',
        payment_plan: {
          down_payment_pct: 10,
          handover_pct: 50,
          post_handover_months: 24,
          post_handover_pct: 40,
        },
      },
      'property-for-sale',
    );
    expect(r.success).toBe(true);
  });

  it('rejects an off-plan sale missing payment_plan', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'apartment',
        area_sqm: 120,
        completion_status: 'off_plan',
        zoning_type: 'investment',
        handover_expected_quarter: '2027-Q3',
      },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('payment_plan');
    }
  });

  it('rejects a land sub-cat whose property_type is not land-plot', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'villa',
        area_sqm: 550,
      },
      'land',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('property_type');
    }
  });

  it('rejects a land-plot without plot_area_sqm', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'land-plot',
        area_sqm: 500,
      },
      'land',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('plot_area_sqm');
    }
  });
});
