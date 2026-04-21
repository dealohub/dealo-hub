import { z } from 'zod';
import type { PropertyCategoryKey } from './types';

/**
 * PropertyFields — Zod schema for the `listings.category_fields` JSONB
 * body of real-estate listings.
 *
 * Design (mirrors src/lib/rides/validators.ts):
 *   - Raw schema matches the DB JSONB exactly (snake_case, permissive
 *     `.passthrough()` for forward-compat)
 *   - Conditional refinements via `.superRefine()` — rent sub-cats
 *     require `rent_period`, sale sub-cats require `completion_status`,
 *     chalet rent requires `availability.min_stay_nights`, off-plan
 *     requires `payment_plan`, etc.
 *   - `.transform()` emits camelCase for the UI layer
 *
 * Architecture:
 *   - `PropertyFieldsSchema` = the Zod validator (pre-transform)
 *   - `PropertyFieldsParsed` = `.transform()`-wrapped schema for consumers
 *   - `PropertyFields` = `z.infer<PropertyFieldsParsed>` — the camelCase type
 *
 * Usage from query layer:
 *   const result = PropertyFieldsParsed.safeParse(
 *     row.category_fields,
 *     { path: [`listings[${row.id}].category_fields`] }
 *   );
 *   // Conditional requirements need the sub-cat; pass it via refineCtx:
 *   const refined = validatePropertyFields(row.category_fields, row.subCat);
 *
 * Reference: planning/PHASE-4A-AUDIT.md §4 (34 fields across 7 domains)
 */

// ---------------------------------------------------------------------------
// Literal enums
// ---------------------------------------------------------------------------

export const PropertyTypeSchema = z.enum([
  'apartment',
  'villa',
  'townhouse',
  'chalet',
  'studio',
  'duplex',
  'penthouse',
  'floor',
  'annex',
  'office',
  'shop',
  'warehouse',
  'room',
  'land-plot',
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const FurnishedStatusSchema = z.enum([
  'unfurnished',
  'semi_furnished',
  'fully_furnished',
]);

export const CompletionStatusSchema = z.enum([
  'ready',
  'under_construction',
  'off_plan',
]);

export const RentPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const ChequesCountSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(4),
  z.literal(6),
  z.literal(12),
]);

export const TenureSchema = z.enum(['freehold', 'leasehold']);

export const CommissionPayerSchema = z.enum([
  'tenant',
  'owner',
  'split',
  'none',
]);

export const OrientationSchema = z.enum([
  'north',
  'south',
  'east',
  'west',
  'corner',
]);

export const ViewTypeSchema = z.enum([
  'sea',
  'city',
  'garden',
  'courtyard',
  'street',
]);

export const ZoningTypeSchema = z.enum([
  'residential-private',
  'investment',
  'commercial',
  'chalet',
  'industrial',
  'agricultural',
]);

export const ConditionSchema = z.enum([
  'new',
  'excellent',
  'good',
  'needs_renovation',
]);

/** 22 locked amenity slugs — PHASE-4A-AUDIT §5. */
export const AmenitySchema = z.enum([
  // Essentials
  'central_ac',
  'split_ac',
  'elevator',
  'covered_parking',
  'backup_generator',
  'water_tank',
  'balcony',
  'storage_room',
  // Comfort
  'swimming_pool_shared',
  'swimming_pool_private',
  'gym',
  'maid_room',
  'driver_room',
  // Security
  '24h_security',
  'cctv',
  'gated_community',
  // Lifestyle / Kuwait-specific
  'sea_view',
  'garden',
  'kids_play_area',
  'beachfront',
  'private_entrance',
  'roof_access',
]);
export type Amenity = z.infer<typeof AmenitySchema>;

// ---------------------------------------------------------------------------
// Structured sub-objects
// ---------------------------------------------------------------------------

export const PlotBlockSchema = z.object({
  area: z.string().max(40),
  block: z.string().max(20),
  plot: z.string().max(20),
});

/** Structured diwaniya per P14 — more than a flat boolean amenity. */
export const DiwaniyaSchema = z.object({
  present: z.boolean(),
  separate_entrance: z.boolean().optional(),
  has_bathroom: z.boolean().optional(),
  has_kitchenette: z.boolean().optional(),
});

/** Off-plan payment plan. Required when completion_status = 'off_plan'. */
export const PaymentPlanSchema = z.object({
  down_payment_pct: z.number().int().min(0).max(100),
  handover_pct: z.number().int().min(0).max(100),
  post_handover_months: z.number().int().min(0).max(120).optional(),
  post_handover_pct: z.number().int().min(0).max(100).optional(),
});

/** Chalet availability primitives. Required when property_type='chalet' AND
 *  sub-cat is a rent type. Date-level booking state lives in a separate
 *  table (Phase 4e). */
export const AvailabilitySchema = z.object({
  min_stay_nights: z.number().int().min(1).max(365),
  max_stay_nights: z.number().int().min(1).max(365).optional(),
  check_in_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'check_in_time must be HH:MM')
    .optional(),
  check_out_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'check_out_time must be HH:MM')
    .optional(),
  cleaning_fee_kwd: z.number().int().min(0).max(10000).optional(),
  weekend_premium_pct: z.number().int().min(0).max(500).optional(),
  seasonal_multipliers: z
    .object({
      summer: z.number().min(0.1).max(10).optional(),
      winter: z.number().min(0.1).max(10).optional(),
      ramadan: z.number().min(0.1).max(10).optional(),
      eid: z.number().min(0.1).max(10).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Raw (snake_case, pre-transform) schema
// ---------------------------------------------------------------------------

export const PropertyFieldsRaw = z
  .object({
    // Identity
    property_type: PropertyTypeSchema,
    building_name: z.string().max(120).optional(),
    developer_name: z.string().max(120).optional(),
    paci_number: z.string().max(20).optional(),
    plot_block: PlotBlockSchema.optional(),
    deed_ref: z.string().max(40).optional(),
    is_deed_verified: z.boolean().default(false),

    // Dimensions
    bedrooms: z.number().int().min(0).max(20).optional(),
    bathrooms: z.number().int().min(0).max(20).optional(),
    area_sqm: z.number().int().min(10).max(50_000),
    plot_area_sqm: z.number().int().min(100).max(50_000).optional(),
    floor_number: z.number().int().min(0).max(200).optional(),
    total_floors: z.number().int().min(1).max(200).optional(),
    year_built: z
      .number()
      .int()
      .min(1950)
      .max(new Date().getFullYear() + 3)
      .optional(),

    // Condition & furnishing
    furnished_status: FurnishedStatusSchema.optional(),
    completion_status: CompletionStatusSchema.optional(),
    handover_expected_quarter: z
      .string()
      .regex(/^\d{4}-Q[1-4]$/, 'handover_expected_quarter must be YYYY-QN')
      .optional(),
    condition: ConditionSchema.optional(),

    // Commercial terms
    rent_period: RentPeriodSchema.optional(),
    cheques_count: ChequesCountSchema.optional(),
    deposit_minor_units: z.number().int().min(0).optional(),
    service_charge_kwd: z.number().int().min(0).max(100_000).optional(),
    commission_payer: CommissionPayerSchema.optional(),
    tenure: TenureSchema.optional(),
    payment_plan: PaymentPlanSchema.optional(),

    // Lifestyle
    parking_spaces: z.number().int().min(0).max(50).optional(),
    orientation: OrientationSchema.optional(),
    view_type: ViewTypeSchema.optional(),
    amenities: z.array(AmenitySchema).default([]),
    diwaniya: DiwaniyaSchema.optional(),

    // Zoning (drives ownership_eligibility banner)
    zoning_type: ZoningTypeSchema.optional(),

    // Chalet booking
    availability: AvailabilitySchema.optional(),
  })
  .passthrough();

export type PropertyFieldsRawT = z.infer<typeof PropertyFieldsRaw>;

// ---------------------------------------------------------------------------
// Conditional refinement — requires sub-cat context
// ---------------------------------------------------------------------------

/**
 * Validate a raw category_fields blob against the sub-cat-dependent
 * invariants. Returns SafeParseReturn — consumers can branch on
 * `.success` and access `.data` / `.error`.
 *
 * Call this instead of `PropertyFieldsRaw.parse()` at query time, since
 * conditional requirements can't be expressed in the bare schema.
 */
export function validatePropertyFieldsRaw(
  raw: unknown,
  subCat: PropertyCategoryKey,
): z.SafeParseReturnType<unknown, PropertyFieldsRawT> {
  const baseResult = PropertyFieldsRaw.safeParse(raw);
  if (!baseResult.success) return baseResult;

  const data = baseResult.data;
  const issues: z.ZodIssue[] = [];

  const isRent =
    subCat === 'property-for-rent' || subCat === 'rooms-for-rent';
  const isSale = subCat === 'property-for-sale';
  const isLand = subCat === 'land';
  const isRooms = subCat === 'rooms-for-rent';
  const isChalet = data.property_type === 'chalet';
  const isLandPlot = data.property_type === 'land-plot';

  // Rent requires rent_period
  if (isRent && !data.rent_period) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['rent_period'],
      message: 'rent_period required for rent sub-cats',
    });
  }
  // Yearly rent requires cheques_count (GCC convention — P12)
  if (isRent && data.rent_period === 'yearly' && !data.cheques_count) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['cheques_count'],
      message: 'cheques_count required for yearly rent',
    });
  }
  // Sale requires completion_status + zoning_type
  if (isSale) {
    if (!data.completion_status) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['completion_status'],
        message: 'completion_status required for sale sub-cats',
      });
    }
    if (!data.zoning_type) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['zoning_type'],
        message: 'zoning_type required for sale sub-cats (P8 — ownership eligibility)',
      });
    }
  }
  // Chalet rent requires availability
  if (isRent && isChalet && !data.availability?.min_stay_nights) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['availability', 'min_stay_nights'],
      message: 'chalet rent requires availability.min_stay_nights',
    });
  }
  // Off-plan sale requires payment_plan + handover quarter
  if (isSale && data.completion_status === 'off_plan') {
    if (!data.payment_plan) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['payment_plan'],
        message: 'off-plan sale requires payment_plan',
      });
    }
    if (!data.handover_expected_quarter) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['handover_expected_quarter'],
        message: 'off-plan sale requires handover_expected_quarter',
      });
    }
  }
  // Land sub-cat must be land-plot
  if (isLand && !isLandPlot) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['property_type'],
      message: 'land sub-cat requires property_type=land-plot',
    });
  }
  // Rooms sub-cat must be room
  if (isRooms && data.property_type !== 'room') {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['property_type'],
      message: 'rooms-for-rent requires property_type=room',
    });
  }
  // Land-plot requires plot_area_sqm
  if (isLandPlot && !data.plot_area_sqm) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['plot_area_sqm'],
      message: 'land-plot requires plot_area_sqm',
    });
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: new z.ZodError(issues),
    };
  }
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Transform to camelCase (consumer-facing)
// ---------------------------------------------------------------------------

export interface PropertyFields {
  // Identity
  propertyType: PropertyType;
  buildingName?: string;
  developerName?: string;
  paciNumber?: string;
  plotBlock?: { area: string; block: string; plot: string };
  deedRef?: string;
  isDeedVerified: boolean;

  // Dimensions
  bedrooms?: number;
  bathrooms?: number;
  areaSqm: number;
  plotAreaSqm?: number;
  floorNumber?: number;
  totalFloors?: number;
  yearBuilt?: number;

  // Condition & furnishing
  furnishedStatus?: z.infer<typeof FurnishedStatusSchema>;
  completionStatus?: z.infer<typeof CompletionStatusSchema>;
  handoverExpectedQuarter?: string;
  condition?: z.infer<typeof ConditionSchema>;

  // Commercial terms
  rentPeriod?: z.infer<typeof RentPeriodSchema>;
  chequesCount?: z.infer<typeof ChequesCountSchema>;
  depositMinorUnits?: number;
  serviceChargeKwd?: number;
  commissionPayer?: z.infer<typeof CommissionPayerSchema>;
  tenure?: z.infer<typeof TenureSchema>;
  paymentPlan?: {
    downPaymentPct: number;
    handoverPct: number;
    postHandoverMonths?: number;
    postHandoverPct?: number;
  };

  // Lifestyle
  parkingSpaces?: number;
  orientation?: z.infer<typeof OrientationSchema>;
  viewType?: z.infer<typeof ViewTypeSchema>;
  amenities: Amenity[];
  diwaniya?: {
    present: boolean;
    separateEntrance?: boolean;
    hasBathroom?: boolean;
    hasKitchenette?: boolean;
  };

  // Zoning
  zoningType?: z.infer<typeof ZoningTypeSchema>;

  // Chalet booking
  availability?: {
    minStayNights: number;
    maxStayNights?: number;
    checkInTime?: string;
    checkOutTime?: string;
    cleaningFeeKwd?: number;
    weekendPremiumPct?: number;
    seasonalMultipliers?: {
      summer?: number;
      winter?: number;
      ramadan?: number;
      eid?: number;
    };
  };
}

/** Transform raw (snake_case) to camelCase PropertyFields. Assumes
 *  `validatePropertyFieldsRaw` already passed. Pure function, no Zod. */
export function toPropertyFields(raw: PropertyFieldsRawT): PropertyFields {
  return {
    propertyType: raw.property_type,
    buildingName: raw.building_name,
    developerName: raw.developer_name,
    paciNumber: raw.paci_number,
    plotBlock: raw.plot_block,
    deedRef: raw.deed_ref,
    isDeedVerified: raw.is_deed_verified ?? false,

    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    areaSqm: raw.area_sqm,
    plotAreaSqm: raw.plot_area_sqm,
    floorNumber: raw.floor_number,
    totalFloors: raw.total_floors,
    yearBuilt: raw.year_built,

    furnishedStatus: raw.furnished_status,
    completionStatus: raw.completion_status,
    handoverExpectedQuarter: raw.handover_expected_quarter,
    condition: raw.condition,

    rentPeriod: raw.rent_period,
    chequesCount: raw.cheques_count,
    depositMinorUnits: raw.deposit_minor_units,
    serviceChargeKwd: raw.service_charge_kwd,
    commissionPayer: raw.commission_payer,
    tenure: raw.tenure,
    paymentPlan: raw.payment_plan
      ? {
          downPaymentPct: raw.payment_plan.down_payment_pct,
          handoverPct: raw.payment_plan.handover_pct,
          postHandoverMonths: raw.payment_plan.post_handover_months,
          postHandoverPct: raw.payment_plan.post_handover_pct,
        }
      : undefined,

    parkingSpaces: raw.parking_spaces,
    orientation: raw.orientation,
    viewType: raw.view_type,
    amenities: raw.amenities ?? [],
    diwaniya: raw.diwaniya
      ? {
          present: raw.diwaniya.present,
          separateEntrance: raw.diwaniya.separate_entrance,
          hasBathroom: raw.diwaniya.has_bathroom,
          hasKitchenette: raw.diwaniya.has_kitchenette,
        }
      : undefined,

    zoningType: raw.zoning_type,

    availability: raw.availability
      ? {
          minStayNights: raw.availability.min_stay_nights,
          maxStayNights: raw.availability.max_stay_nights,
          checkInTime: raw.availability.check_in_time,
          checkOutTime: raw.availability.check_out_time,
          cleaningFeeKwd: raw.availability.cleaning_fee_kwd,
          weekendPremiumPct: raw.availability.weekend_premium_pct,
          seasonalMultipliers: raw.availability.seasonal_multipliers,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Ownership eligibility derivation (P8 — Law 74/1979)
// ---------------------------------------------------------------------------

/**
 * Derives the ownership-eligibility banner label from sub-cat + zoning.
 * Applied to sale listings only; rent listings get null (no banner).
 *
 * Kuwait Law 74/1979 prohibits non-Kuwaiti ownership with narrow
 * exceptions. GCC nationals may own one residential property subject
 * to reciprocity. Investment zones don't exist in Kuwait (as of 2026);
 * they're included in the enum for future UAE/KSA listings.
 *
 * Returns null when no banner is required (e.g., rent listings).
 */
export type OwnershipEligibility =
  | 'kuwaiti-only'
  | 'gcc-reciprocal'
  | 'open'
  | null;

export function deriveOwnershipEligibility(
  subCat: PropertyCategoryKey,
  zoningType: z.infer<typeof ZoningTypeSchema> | undefined,
): OwnershipEligibility {
  // Rent & exchange: no ownership banner (tenants don't own)
  if (
    subCat === 'property-for-rent' ||
    subCat === 'rooms-for-rent' ||
    subCat === 'property-for-exchange'
  ) {
    return null;
  }
  // International: unrestricted by Kuwait law (foreign jurisdiction)
  if (subCat === 'international-property') return 'open';
  // Sale + residential-private: Kuwaiti-only (Law 74)
  if (subCat === 'property-for-sale' && zoningType === 'residential-private') {
    return 'kuwaiti-only';
  }
  // Sale + chalet zoning: Kuwaiti-only (coastal chalet plots are residential-class)
  if (subCat === 'property-for-sale' && zoningType === 'chalet') {
    return 'kuwaiti-only';
  }
  // Sale + investment zone: GCC nationals welcome (reciprocity)
  if (subCat === 'property-for-sale' && zoningType === 'investment') {
    return 'gcc-reciprocal';
  }
  // Sale + commercial/industrial/agricultural: KDIPA/Kuwaiti partnership path
  if (
    subCat === 'property-for-sale' &&
    (zoningType === 'commercial' ||
      zoningType === 'industrial' ||
      zoningType === 'agricultural')
  ) {
    return 'gcc-reciprocal';
  }
  // Land: same logic as for-sale
  if (subCat === 'land') {
    if (zoningType === 'residential-private' || zoningType === 'chalet') {
      return 'kuwaiti-only';
    }
    return 'gcc-reciprocal';
  }
  // Default (unknown combinations): conservative — Kuwaiti-only
  return 'kuwaiti-only';
}

// ---------------------------------------------------------------------------
// Draft-time partial schema (progressive wizard)
// ---------------------------------------------------------------------------
//
// The /sell wizard edits PropertyFields over several UI interactions —
// e.g., a seller can pick the property type before typing the area in
// sq m. Forcing the full refined schema at draft-save time would reject
// every intermediate state and the debounced saver would blow up.
//
// PropertyFieldsDraftSchema is `PropertyFieldsRaw.partial()` with two
// tweaks: (a) `.passthrough()` is preserved so unknown keys don't break
// forward-compat, and (b) defaulted fields keep their defaults so the
// UI can round-trip booleans without surprise resets.
//
// Publish-time validation still calls `validatePropertyFieldsRaw(raw,
// subCat)` — that's where conditional-required invariants are enforced.
// The draft schema is lenient on purpose.

export const PropertyFieldsDraftSchema = PropertyFieldsRaw.partial().passthrough();

export type PropertyFieldsDraft = z.infer<typeof PropertyFieldsDraftSchema>;

/** Detect whether a given category_fields blob is meaningful enough to
 *  write to the draft row (avoids writing empty `{}` as a no-op). */
export function isPropertyFieldsDraftNonEmpty(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const keys = Object.keys(raw as Record<string, unknown>);
  return keys.length > 0;
}
