import { z } from 'zod';

/**
 * Zod schemas for the rides (automotive) vertical.
 *
 * Strategy:
 *   - The JSONB column `listings.category_fields` is populated with
 *     snake_case keys (matches the DB seed + the spec in
 *     TAXONOMY-V2.md §Schema).
 *   - App code (queries, components) works in camelCase.
 *   - Zod's `.transform()` bridges the two: the raw schema validates
 *     the snake_case shape, then transforms into a camelCase object.
 *
 * Consumers should treat `UsedCarFields` (the output type) as the
 * single source of truth and never reach back to snake_case keys.
 *
 * Reference: planning/TAXONOMY-V2.md §Schema (automotive/used-cars slice)
 * Reference: planning/PHASE-3B-AUDIT.md §4 (Phase 3b additions)
 * Reference: supabase/migrations/0022_reseed_cars_full.sql (canonical seed shape)
 */

// ---------------------------------------------------------------------------
// Enum helpers — values match the JSONB seed + Zod input
// ---------------------------------------------------------------------------

export const TransmissionEnum = z.enum(['automatic', 'manual', 'cvt', 'dct']);
export type Transmission = z.infer<typeof TransmissionEnum>;

export const FuelTypeEnum = z.enum([
  'petrol',
  'diesel',
  'hybrid',
  'plug_in_hybrid',
  'electric',
]);
export type FuelType = z.infer<typeof FuelTypeEnum>;

export const BodyStyleEnum = z.enum([
  'sedan',
  'suv',
  'coupe',
  'hatchback',
  'pickup',
  'convertible',
  'wagon',
  'van',
  'other',
]);
export type BodyStyle = z.infer<typeof BodyStyleEnum>;

export const AccidentHistoryEnum = z.enum(['none', 'minor', 'major', 'unknown']);
export type AccidentHistory = z.infer<typeof AccidentHistoryEnum>;

export const ServiceHistoryEnum = z.enum([
  'full',
  'partial',
  'none',
  'unknown',
]);
export type ServiceHistory = z.infer<typeof ServiceHistoryEnum>;

export const DrivetrainEnum = z.enum(['awd', 'fwd', 'rwd', '4wd']);
export type Drivetrain = z.infer<typeof DrivetrainEnum>;

export const RegionSpecEnum = z.enum([
  'gcc',
  'american',
  'european',
  'japanese',
  'other',
]);
export type RegionSpec = z.infer<typeof RegionSpecEnum>;

// ---------------------------------------------------------------------------
// Feature taxonomy — 30 keys split into 5 categories for UI grouping
// ---------------------------------------------------------------------------

export const FeatureKeyEnum = z.enum([
  // safety
  'abs',
  'airbags',
  'esp',
  'adaptiveCruise',
  'laneAssist',
  'blindSpot',
  'camera360',
  'parkingSensors',
  // comfort
  'leatherSeats',
  'heatedSeats',
  'ventilatedSeats',
  'climateControl',
  'sunroof',
  'keylessEntry',
  'remoteStart',
  'powerSeats',
  // tech
  'applecarplay',
  'androidauto',
  'navigation',
  'wirelessCharging',
  'headupDisplay',
  'digitalCluster',
  'premiumSound',
  'bluetooth',
  // entertainment
  'rearEntertainment',
  'ambientLighting',
  // exterior
  'ledHeadlights',
  'alloyWheels',
  'powerTailgate',
  'towHitch',
  'roofRack',
]);
export type FeatureKey = z.infer<typeof FeatureKeyEnum>;

export type FeatureCategory =
  | 'safety'
  | 'comfort'
  | 'tech'
  | 'entertainment'
  | 'exterior';

/** Static grouping used by the features component for category headers. */
export const FEATURE_CATEGORIES: Record<FeatureCategory, FeatureKey[]> = {
  safety: [
    'abs',
    'airbags',
    'esp',
    'adaptiveCruise',
    'laneAssist',
    'blindSpot',
    'camera360',
    'parkingSensors',
  ],
  comfort: [
    'leatherSeats',
    'heatedSeats',
    'ventilatedSeats',
    'climateControl',
    'sunroof',
    'keylessEntry',
    'remoteStart',
    'powerSeats',
  ],
  tech: [
    'applecarplay',
    'androidauto',
    'navigation',
    'wirelessCharging',
    'headupDisplay',
    'digitalCluster',
    'premiumSound',
    'bluetooth',
  ],
  entertainment: ['rearEntertainment', 'ambientLighting'],
  exterior: [
    'ledHeadlights',
    'alloyWheels',
    'powerTailgate',
    'towHitch',
    'roofRack',
  ],
};

// ---------------------------------------------------------------------------
// Input shape — validates what's stored in listings.category_fields JSONB
// (snake_case, matches seed + TAXONOMY-V2 §Schema)
// ---------------------------------------------------------------------------

const UsedCarFieldsRawSchema = z.object({
  // Identification
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  trim_level: z.string().optional(),

  // Usage
  mileage_km: z.number().int().min(0).optional(),

  // Powertrain
  engine_cc: z.number().int().min(0).optional(),
  cylinders: z.number().int().min(0).max(16).optional(),
  horsepower: z.number().int().min(0).optional(),
  torque_nm: z.number().int().min(0).max(2500).optional(),
  transmission: TransmissionEnum,
  fuel_type: FuelTypeEnum,
  drivetrain: DrivetrainEnum.optional(),

  // Body
  body_style: BodyStyleEnum.optional(),
  doors: z.number().int().min(0).max(6).optional(),
  seats: z.number().int().min(1).max(60).optional(),
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),

  // Docs
  vin: z.string().length(17).optional(),
  registration_ref: z.string().max(40).optional(),

  // History
  accident_history: AccidentHistoryEnum,
  service_history_status: ServiceHistoryEnum.optional(),

  // Market / provenance
  region_spec: RegionSpecEnum.optional(),
  warranty_active: z.boolean().optional(),
  warranty_remaining_months: z.number().int().min(0).max(240).optional(),

  // Equipment
  features: z.array(FeatureKeyEnum).optional(),
});

// ---------------------------------------------------------------------------
// Output shape — camelCase, consumed by app code
// ---------------------------------------------------------------------------

export const UsedCarFieldsSchema = UsedCarFieldsRawSchema.transform((raw) => ({
  // Identification
  make: raw.make,
  model: raw.model,
  year: raw.year,
  trimLevel: raw.trim_level,

  // Usage
  mileageKm: raw.mileage_km,

  // Powertrain
  engineCc: raw.engine_cc,
  cylinders: raw.cylinders,
  horsepower: raw.horsepower,
  torqueNm: raw.torque_nm,
  transmission: raw.transmission,
  fuelType: raw.fuel_type,
  drivetrain: raw.drivetrain,

  // Body
  bodyStyle: raw.body_style,
  doors: raw.doors,
  seats: raw.seats,
  exteriorColor: raw.exterior_color,
  interiorColor: raw.interior_color,

  // Docs
  vin: raw.vin,
  registrationRef: raw.registration_ref,

  // History
  accidentHistory: raw.accident_history,
  serviceHistoryStatus: raw.service_history_status,

  // Market / provenance
  regionSpec: raw.region_spec,
  warrantyActive: raw.warranty_active,
  warrantyRemainingMonths: raw.warranty_remaining_months,

  // Equipment — default to empty array so components can `.includes()`
  // without null-guarding. DB absence means "not specified", which in
  // UI terms is "not listed".
  features: raw.features ?? [],
}));

/** App-facing, camelCase. Use this everywhere outside of DB mappers. */
export type UsedCarFields = z.infer<typeof UsedCarFieldsSchema>;
