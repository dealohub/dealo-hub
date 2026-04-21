-- ============================================================================
-- 0026_extend_listings_for_properties.sql — verification tier + bilingual
-- ============================================================================
-- Two additions to the `listings` table that apply cross-vertical
-- (automotive today, properties tomorrow, all future verticals):
--
-- 1. Verification tier (Doctrine pillar P1, P6):
--      verification_tier  enum{unverified, ai_verified, dealo_inspected}
--      verified_at        timestamptz (when the tier was set)
--      verified_by        enum{ai, human, inspection}
--    Drives the trust badge on listing cards + detail pages. Default
--    'unverified' so no existing data is misrepresented.
--
-- 2. Bilingual title + description (Doctrine pillar P10):
--      title_ar           text nullable (Arabic title)
--      title_en           text nullable (English title)
--      description_ar     text nullable
--      description_en     text nullable
--    The existing `title` + `description` columns stay NOT NULL and
--    serve as the backfill source. UI reads title_ar/title_en when
--    present, falls back to title. Phase 4b+ will enforce bilingual
--    at submit for new listings while leaving old listings alone.
--
-- Backfill logic:
--   For every existing listing, copy `title` → `title_en` and
--   `description` → `description_en`. Arabic sides stay null; this
--   matches reality (the 6 automotive seeds are English-only).
--
-- Also:
--   - Upgrade the 6 automotive listings to verification_tier='ai_verified'
--     (seed discipline: they passed our own validators).
--
-- Enum ALTER is one-way in Postgres — values below are locked.
--
-- Reference: planning/PHASE-4A-AUDIT.md §1 (P1, P6, P10)
-- Depends on: 0005 (listings table), 0022 (automotive seed)
-- ============================================================================

-- ── 1. Create enums ─────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tier') THEN
    CREATE TYPE verification_tier AS ENUM ('unverified', 'ai_verified', 'dealo_inspected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_method') THEN
    CREATE TYPE verification_method AS ENUM ('ai', 'human', 'inspection');
  END IF;
END $$;

-- ── 2. Add columns to listings ──────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS verification_tier verification_tier NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by      verification_method,
  ADD COLUMN IF NOT EXISTS title_ar         text,
  ADD COLUMN IF NOT EXISTS title_en         text,
  ADD COLUMN IF NOT EXISTS description_ar   text,
  ADD COLUMN IF NOT EXISTS description_en   text;

-- ── 3. Backfill bilingual from existing title/description ───────────────────
-- The 6 automotive seeds are authored in English; copy into title_en.

UPDATE listings
SET title_en = title,
    description_en = description
WHERE title_en IS NULL;

-- ── 4. Upgrade automotive seeds to ai_verified ──────────────────────────────
-- These 6 listings were validated by our own Zod schema at seed time;
-- they represent the baseline for what 'ai_verified' means.

UPDATE listings
SET verification_tier = 'ai_verified',
    verified_at       = NOW(),
    verified_by       = 'ai'
WHERE category_id IN (
  SELECT id FROM categories WHERE slug = 'used-cars'
) AND verification_tier = 'unverified';

-- ── 5. Index for tier filtering in hub/grid queries ─────────────────────────

CREATE INDEX IF NOT EXISTS idx_listings_verification_tier
  ON listings (verification_tier)
  WHERE status = 'live' AND soft_deleted_at IS NULL;

-- ── 6. Extend listing_images.category CHECK — 8 new property values ─────────
-- Drop the automotive-only constraint and recreate with the union (shared enum,
-- not a fork — see PHASE-4A-AUDIT.md §8). No data migration needed; existing
-- rows have values in the old subset.

ALTER TABLE listing_images
  DROP CONSTRAINT IF EXISTS listing_images_category_check;

ALTER TABLE listing_images
  ADD CONSTRAINT listing_images_category_check
  CHECK (
    category IS NULL OR category = ANY (ARRAY[
      -- Automotive (existing)
      'exterior', 'interior', 'engine', 'wheels', 'details',
      -- Properties (new — Phase 4a)
      'building_exterior', 'living_room', 'bedroom', 'kitchen', 'bathroom',
      'floor_plan', 'view', 'diwaniya_room'
    ]::text[])
  );

-- ── 6. Sanity check ─────────────────────────────────────────────────────────

DO $$
DECLARE
  v_cars_verified INT;
BEGIN
  SELECT COUNT(*) INTO v_cars_verified
  FROM listings
  WHERE verification_tier = 'ai_verified';
  RAISE NOTICE 'Upgraded % automotive listings to ai_verified tier', v_cars_verified;
END $$;
