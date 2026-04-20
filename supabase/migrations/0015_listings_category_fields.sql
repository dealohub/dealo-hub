-- ============================================================================
-- 0015_listings_category_fields.sql — JSONB category-specific fields
-- ============================================================================
-- Adds one JSONB column on listings to hold category-specific structured
-- fields. Same column serves every vertical (automotive, real-estate,
-- jobs, services, ...). Shape per category is validated at the app layer
-- via Zod schemas in src/lib/listings/validators.ts keyed by category slug.
--
-- Why JSONB (not per-vertical FK tables):
--   * Verticals evolve at different speeds — adding a field for one
--     vertical shouldn't migrate another.
--   * GIN index on the whole column supports both containment queries
--     (@>) and key-existence lookups across all categories with one index.
--   * App-layer Zod keeps validation version-controlled alongside the
--     code that reads/writes it.
--
-- Example shapes (contract lives in Zod, not in Postgres):
--   automotive/used-cars:
--     { make, model, year, mileage_km, transmission, fuel_type,
--       vin?, accident_history, engine_cc?, horsepower?, body_style?,
--       exterior_color?, interior_color?, service_history_status?,
--       trim_level?, drivetrain? }
--   real-estate/property-for-rent:
--     { property_type, bedrooms, bathrooms, area_sqm, furnished,
--       utilities_included }
--   watercraft:
--     { type, length_ft, engine_hp, hull_material, year }
--   jobs/vacancies:
--     { salary_range, contract_type, industry, experience_level }
--
-- Reference: planning/TAXONOMY-V2.md §Schema Implications (2026-04-18)
-- Depends on: 0005_listings.sql
-- ============================================================================

ALTER TABLE listings
  ADD COLUMN category_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN listings.category_fields IS
  'Category-specific structured fields. Validated per category via app-layer Zod schemas. See planning/TAXONOMY-V2.md §Schema.';

-- GIN index enables fast:
--   * containment:      category_fields @> '{"year":2024}'
--   * key existence:    category_fields ? 'vin'
--   * path extraction:  category_fields->>'body_style' = 'sedan'
--
-- Phase 3c may add targeted expression indexes on hot filter keys
-- (e.g. ((category_fields->>'year')::int)) if query plans justify it.
CREATE INDEX listings_category_fields_gin_idx
  ON listings USING gin (category_fields);
