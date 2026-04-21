import { describe, it, expect } from 'vitest';
import {
  PropertyFieldsRaw,
  validatePropertyFieldsRaw,
  toPropertyFields,
  deriveOwnershipEligibility,
  type PropertyFieldsRawT,
} from './validators';
import type { PropertyCategoryKey } from './types';

/**
 * PropertyFields validator tests.
 *
 * Three layers under test:
 *   1. PropertyFieldsRaw — shape validation (types + ranges)
 *   2. validatePropertyFieldsRaw(raw, subCat) — conditional invariants
 *      (rent ⇒ rent_period, yearly rent ⇒ cheques_count, sale ⇒
 *      completion_status + zoning_type, chalet rent ⇒ availability,
 *      off-plan ⇒ payment_plan + handover_quarter, land ⇒ land-plot,
 *      rooms ⇒ room, land-plot ⇒ plot_area_sqm)
 *   3. deriveOwnershipEligibility(subCat, zoning) — Law 74/1979
 *
 * These validators are the doctrine enforcers for Phase 4a
 * (14 pillars). A silent regression here = a Dubizzle-class listing
 * lands on Dealo. The suite locks the invariants down.
 */

// ---------------------------------------------------------------------------
// Fixtures — minimal valid raw payloads per common case
// ---------------------------------------------------------------------------

const validSaleVillaBase: PropertyFieldsRawT = {
  property_type: 'villa',
  area_sqm: 550,
  is_deed_verified: true,
  amenities: ['central_ac', 'garden'],
  completion_status: 'ready',
  zoning_type: 'residential-private',
};

const validYearlyRentApartmentBase: PropertyFieldsRawT = {
  property_type: 'apartment',
  area_sqm: 120,
  is_deed_verified: false,
  amenities: [],
  rent_period: 'yearly',
  cheques_count: 4,
};

const validChaletRentBase: PropertyFieldsRawT = {
  property_type: 'chalet',
  area_sqm: 320,
  is_deed_verified: false,
  amenities: ['beachfront', 'swimming_pool_private'],
  rent_period: 'daily',
  availability: {
    min_stay_nights: 2,
    check_in_time: '15:00',
    check_out_time: '12:00',
  },
};

const validOffPlanBase: PropertyFieldsRawT = {
  property_type: 'apartment',
  area_sqm: 95,
  is_deed_verified: false,
  amenities: [],
  completion_status: 'off_plan',
  zoning_type: 'investment',
  handover_expected_quarter: '2027-Q2',
  payment_plan: {
    down_payment_pct: 20,
    handover_pct: 50,
    post_handover_months: 24,
    post_handover_pct: 30,
  },
};

const validLandBase: PropertyFieldsRawT = {
  property_type: 'land-plot',
  area_sqm: 700,
  plot_area_sqm: 700,
  is_deed_verified: true,
  amenities: [],
  completion_status: 'ready',
  zoning_type: 'residential-private',
};

const validRoomRentBase: PropertyFieldsRawT = {
  property_type: 'room',
  area_sqm: 20,
  is_deed_verified: false,
  amenities: [],
  rent_period: 'monthly',
};

// ---------------------------------------------------------------------------
// PropertyFieldsRaw — shape validation
// ---------------------------------------------------------------------------

describe('PropertyFieldsRaw (shape)', () => {
  it('accepts a minimal valid payload', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 100,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid property_type', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'spaceship',
      area_sqm: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects area_sqm below minimum', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown amenity slug', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 100,
      amenities: ['not_a_real_amenity'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed handover_expected_quarter', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 100,
      handover_expected_quarter: '2027/Q2',
    });
    expect(result.success).toBe(false);
  });

  it('accepts well-formed handover quarter', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 100,
      handover_expected_quarter: '2027-Q2',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all 22 locked amenity slugs', () => {
    const allAmenities = [
      'central_ac', 'split_ac', 'elevator', 'covered_parking',
      'backup_generator', 'water_tank', 'balcony', 'storage_room',
      'swimming_pool_shared', 'swimming_pool_private', 'gym',
      'maid_room', 'driver_room', '24h_security', 'cctv',
      'gated_community', 'sea_view', 'garden', 'kids_play_area',
      'beachfront', 'private_entrance', 'roof_access',
    ];
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'villa',
      area_sqm: 500,
      amenities: allAmenities,
    });
    expect(result.success).toBe(true);
  });

  it('defaults is_deed_verified to false when absent', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_deed_verified).toBe(false);
  });

  it('validates invalid cheques_count (not in {1,2,4,6,12})', () => {
    const result = PropertyFieldsRaw.safeParse({
      property_type: 'apartment',
      area_sqm: 100,
      cheques_count: 3,
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid cheques_count', () => {
    for (const n of [1, 2, 4, 6, 12] as const) {
      const result = PropertyFieldsRaw.safeParse({
        property_type: 'apartment',
        area_sqm: 100,
        cheques_count: n,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// validatePropertyFieldsRaw — conditional refinement
// ---------------------------------------------------------------------------

describe('validatePropertyFieldsRaw — happy paths', () => {
  it('valid sale villa passes', () => {
    const r = validatePropertyFieldsRaw(
      validSaleVillaBase,
      'property-for-sale',
    );
    expect(r.success).toBe(true);
  });

  it('valid yearly rent apartment passes', () => {
    const r = validatePropertyFieldsRaw(
      validYearlyRentApartmentBase,
      'property-for-rent',
    );
    expect(r.success).toBe(true);
  });

  it('valid monthly rent (no cheques needed) passes', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'apartment',
        area_sqm: 120,
        is_deed_verified: false,
        amenities: [],
        rent_period: 'monthly',
      },
      'property-for-rent',
    );
    expect(r.success).toBe(true);
  });

  it('valid chalet rent passes', () => {
    const r = validatePropertyFieldsRaw(validChaletRentBase, 'property-for-rent');
    expect(r.success).toBe(true);
  });

  it('valid off-plan sale passes', () => {
    const r = validatePropertyFieldsRaw(validOffPlanBase, 'property-for-sale');
    expect(r.success).toBe(true);
  });

  it('valid land listing passes', () => {
    const r = validatePropertyFieldsRaw(validLandBase, 'land');
    expect(r.success).toBe(true);
  });

  it('valid room-for-rent passes', () => {
    const r = validatePropertyFieldsRaw(validRoomRentBase, 'rooms-for-rent');
    expect(r.success).toBe(true);
  });
});

describe('validatePropertyFieldsRaw — refinement failures', () => {
  it('rent missing rent_period fails', () => {
    const r = validatePropertyFieldsRaw(
      {
        property_type: 'apartment',
        area_sqm: 120,
        is_deed_verified: false,
        amenities: [],
      },
      'property-for-rent',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('rent_period'))).toBe(true);
    }
  });

  it('yearly rent missing cheques_count fails', () => {
    const r = validatePropertyFieldsRaw(
      {
        ...validYearlyRentApartmentBase,
        cheques_count: undefined,
      },
      'property-for-rent',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('cheques_count'))).toBe(true);
    }
  });

  it('sale missing completion_status fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validSaleVillaBase, completion_status: undefined },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(i => i.path.includes('completion_status')),
      ).toBe(true);
    }
  });

  it('sale missing zoning_type fails (P8 — ownership banner prereq)', () => {
    const r = validatePropertyFieldsRaw(
      { ...validSaleVillaBase, zoning_type: undefined },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('zoning_type'))).toBe(true);
    }
  });

  it('chalet rent missing availability.min_stay_nights fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validChaletRentBase, availability: undefined },
      'property-for-rent',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(i => i.path.includes('min_stay_nights')),
      ).toBe(true);
    }
  });

  it('off-plan sale missing payment_plan fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validOffPlanBase, payment_plan: undefined },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('payment_plan'))).toBe(
        true,
      );
    }
  });

  it('off-plan sale missing handover_expected_quarter fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validOffPlanBase, handover_expected_quarter: undefined },
      'property-for-sale',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(i =>
          i.path.includes('handover_expected_quarter'),
        ),
      ).toBe(true);
    }
  });

  it('land sub-cat with non-land-plot property_type fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validLandBase, property_type: 'villa', plot_area_sqm: 700 },
      'land',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('property_type'))).toBe(
        true,
      );
    }
  });

  it('rooms sub-cat with non-room property_type fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validRoomRentBase, property_type: 'apartment' },
      'rooms-for-rent',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('property_type'))).toBe(
        true,
      );
    }
  });

  it('land-plot without plot_area_sqm fails', () => {
    const r = validatePropertyFieldsRaw(
      { ...validLandBase, plot_area_sqm: undefined },
      'land',
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('plot_area_sqm'))).toBe(
        true,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// toPropertyFields — snake → camel transform
// ---------------------------------------------------------------------------

describe('toPropertyFields (camel transform)', () => {
  it('maps flat fields', () => {
    const out = toPropertyFields({
      property_type: 'villa',
      area_sqm: 550,
      plot_area_sqm: 700,
      bedrooms: 6,
      bathrooms: 5,
      year_built: 2015,
      is_deed_verified: true,
      amenities: [],
    });
    expect(out.propertyType).toBe('villa');
    expect(out.areaSqm).toBe(550);
    expect(out.plotAreaSqm).toBe(700);
    expect(out.bedrooms).toBe(6);
    expect(out.bathrooms).toBe(5);
    expect(out.yearBuilt).toBe(2015);
    expect(out.isDeedVerified).toBe(true);
  });

  it('maps nested plot_block', () => {
    const out = toPropertyFields({
      property_type: 'villa',
      area_sqm: 550,
      is_deed_verified: false,
      amenities: [],
      plot_block: { area: 'Bayan', block: '3', plot: '127' },
    });
    expect(out.plotBlock).toEqual({ area: 'Bayan', block: '3', plot: '127' });
  });

  it('maps nested payment_plan (off-plan)', () => {
    const out = toPropertyFields(validOffPlanBase);
    expect(out.paymentPlan).toEqual({
      downPaymentPct: 20,
      handoverPct: 50,
      postHandoverMonths: 24,
      postHandoverPct: 30,
    });
  });

  it('maps nested diwaniya (P14)', () => {
    const out = toPropertyFields({
      property_type: 'villa',
      area_sqm: 550,
      is_deed_verified: false,
      amenities: [],
      diwaniya: {
        present: true,
        separate_entrance: true,
        has_bathroom: true,
        has_kitchenette: false,
      },
    });
    expect(out.diwaniya).toEqual({
      present: true,
      separateEntrance: true,
      hasBathroom: true,
      hasKitchenette: false,
    });
  });

  it('maps nested availability (chalet)', () => {
    const out = toPropertyFields(validChaletRentBase);
    expect(out.availability?.minStayNights).toBe(2);
    expect(out.availability?.checkInTime).toBe('15:00');
    expect(out.availability?.checkOutTime).toBe('12:00');
  });

  it('leaves undefined nested when absent', () => {
    const out = toPropertyFields({
      property_type: 'apartment',
      area_sqm: 100,
      is_deed_verified: false,
      amenities: [],
    });
    expect(out.plotBlock).toBeUndefined();
    expect(out.paymentPlan).toBeUndefined();
    expect(out.diwaniya).toBeUndefined();
    expect(out.availability).toBeUndefined();
  });

  it('defaults amenities to empty array', () => {
    const out = toPropertyFields({
      property_type: 'apartment',
      area_sqm: 100,
      is_deed_verified: false,
      // amenities intentionally omitted — covered by Zod default
    } as PropertyFieldsRawT);
    expect(out.amenities).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deriveOwnershipEligibility — Law 74/1979
// ---------------------------------------------------------------------------

describe('deriveOwnershipEligibility (Law 74)', () => {
  describe('rent & exchange return null (no ownership banner)', () => {
    it.each<[PropertyCategoryKey]>([
      ['property-for-rent'],
      ['rooms-for-rent'],
      ['property-for-exchange'],
    ])('%s → null', subCat => {
      expect(deriveOwnershipEligibility(subCat, 'residential-private')).toBe(
        null,
      );
    });
  });

  it('international-property → open (foreign jurisdiction)', () => {
    expect(deriveOwnershipEligibility('international-property', undefined)).toBe(
      'open',
    );
  });

  describe('sale', () => {
    it('residential-private → kuwaiti-only', () => {
      expect(
        deriveOwnershipEligibility('property-for-sale', 'residential-private'),
      ).toBe('kuwaiti-only');
    });
    it('chalet zoning → kuwaiti-only (coastal plots are residential-class)', () => {
      expect(deriveOwnershipEligibility('property-for-sale', 'chalet')).toBe(
        'kuwaiti-only',
      );
    });
    it('investment zoning → gcc-reciprocal', () => {
      expect(
        deriveOwnershipEligibility('property-for-sale', 'investment'),
      ).toBe('gcc-reciprocal');
    });
    it.each<['commercial' | 'industrial' | 'agricultural']>([
      ['commercial'],
      ['industrial'],
      ['agricultural'],
    ])('%s zoning → gcc-reciprocal (KDIPA partnership)', zoning => {
      expect(deriveOwnershipEligibility('property-for-sale', zoning)).toBe(
        'gcc-reciprocal',
      );
    });
  });

  describe('land', () => {
    it.each<['residential-private' | 'chalet']>([
      ['residential-private'],
      ['chalet'],
    ])('%s zoning → kuwaiti-only', zoning => {
      expect(deriveOwnershipEligibility('land', zoning)).toBe('kuwaiti-only');
    });
    it.each<['commercial' | 'industrial' | 'agricultural' | 'investment']>([
      ['commercial'],
      ['industrial'],
      ['agricultural'],
      ['investment'],
    ])('%s zoning → gcc-reciprocal', zoning => {
      expect(deriveOwnershipEligibility('land', zoning)).toBe('gcc-reciprocal');
    });
  });

  describe('conservative defaults', () => {
    it('sale with missing zoning → kuwaiti-only (safest)', () => {
      expect(
        deriveOwnershipEligibility('property-for-sale', undefined),
      ).toBe('kuwaiti-only');
    });
    it('unknown sub-cat (e.g. property-management) → kuwaiti-only fallback', () => {
      expect(
        deriveOwnershipEligibility('property-management', 'residential-private'),
      ).toBe('kuwaiti-only');
    });
  });
});
