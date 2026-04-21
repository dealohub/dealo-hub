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
 * Reference: supabase/migrations/0019_seed_cars.sql (canonical seed shape)
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

// ---------------------------------------------------------------------------
// Input shape — validates what's stored in listings.category_fields JSONB
// (snake_case, matches seed + TAXONOMY-V2 §Schema)
// ---------------------------------------------------------------------------

const UsedCarFieldsRawSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  mileage_km: z.number().int().min(0).optional(),
  transmission: TransmissionEnum,
  fuel_type: FuelTypeEnum,
  vin: z.string().length(17).optional(),
  accident_history: AccidentHistoryEnum,
  engine_cc: z.number().int().min(0).optional(),
  horsepower: z.number().int().min(0).optional(),
  body_style: BodyStyleEnum.optional(),
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  service_history_status: ServiceHistoryEnum.optional(),
  trim_level: z.string().optional(),
  drivetrain: DrivetrainEnum.optional(),
});

// ---------------------------------------------------------------------------
// Output shape — camelCase, consumed by app code
// ---------------------------------------------------------------------------

export const UsedCarFieldsSchema = UsedCarFieldsRawSchema.transform((raw) => ({
  make: raw.make,
  model: raw.model,
  year: raw.year,
  mileageKm: raw.mileage_km,
  transmission: raw.transmission,
  fuelType: raw.fuel_type,
  vin: raw.vin,
  accidentHistory: raw.accident_history,
  engineCc: raw.engine_cc,
  horsepower: raw.horsepower,
  bodyStyle: raw.body_style,
  exteriorColor: raw.exterior_color,
  interiorColor: raw.interior_color,
  serviceHistoryStatus: raw.service_history_status,
  trimLevel: raw.trim_level,
  drivetrain: raw.drivetrain,
}));

/** App-facing, camelCase. Use this everywhere outside of DB mappers. */
export type UsedCarFields = z.infer<typeof UsedCarFieldsSchema>;
