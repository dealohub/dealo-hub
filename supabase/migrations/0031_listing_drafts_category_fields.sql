-- ============================================================================
-- 0031_listing_drafts_category_fields.sql — carry vertical-specific JSONB
--                                            through the wizard
-- ============================================================================
-- The /sell wizard's Step 3 (details) captures category-specific fields for
-- verticals that need them (Properties = 34 fields in 7 domains; future:
-- Automotive, Jobs, Services). The final `listings` row already has the
-- `category_fields JSONB` column (migration 0015). What was missing: the
-- draft row had no place to stage that blob between steps, so a seller
-- could not actually create a property listing via the wizard.
--
-- This migration adds the mirror column on `listing_drafts` so:
--   1. The Properties step of Step 3 can write PropertyFieldsRaw (snake_case)
--      into the draft during editing.
--   2. `publishListing` can read it back on the final submit, run
--      `validatePropertyFieldsRaw(draft.category_fields, subCatSlug)`, and
--      pass it straight into the listings INSERT.
--
-- Shape mirrors `listings.category_fields` exactly — validated app-side via
-- Zod (src/lib/properties/validators.ts :: PropertyFieldsRaw + conditional
-- refinements). Conditional-required invariants (rent_period for rent,
-- completion_status for sale, etc.) are enforced at publish time, not draft
-- time — the wizard is progressive.
--
-- No GIN index here: drafts are one-per-user (UNIQUE user_id) and never
-- filtered by field content. Single-row lookups by user_id only.
--
-- Reference: planning/PHASE-4A-AUDIT.md §4, §7 (PropertyFields domains)
-- Depends on: 0014 (listing_drafts), 0015 (listings.category_fields)
-- ============================================================================

ALTER TABLE listing_drafts
  ADD COLUMN IF NOT EXISTS category_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN listing_drafts.category_fields IS
  'Staged vertical-specific fields during wizard edit. Mirror of listings.category_fields. Validated app-side (Zod) at publish.';
