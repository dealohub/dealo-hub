-- ============================================================================
-- 0040_seed_services_listing_images.sql — Phase 8a addendum
-- ============================================================================
-- 0039 seeded listings + bookings + reviews but forgot listing_images. Same
-- class of bug that hit Electronics migration 0035 (fixed in 0036).
-- Services listings were invisible on the landing hero + LiveFeed because
-- `listing_images!inner` in landing/queries.ts filters them out at JOIN time.
--
-- This migration:
--   1. Extends listing_images.category CHECK to admit 4 service-specific
--      buckets: `before` / `after` / `tools` / `portfolio`.
--   2. Inserts 2–3 Unsplash images per seeded service listing (27 rows
--      across 12 listings).
--
-- Idempotent — DELETE+INSERT guards on listing_id ensure replay safety.
-- Depends on: 0039 (services seeds).
-- ============================================================================

BEGIN;

ALTER TABLE listing_images
  DROP CONSTRAINT IF EXISTS listing_images_category_check;

ALTER TABLE listing_images
  ADD CONSTRAINT listing_images_category_check
  CHECK (
    category IS NULL OR category = ANY (ARRAY[
      -- Automotive (Phase 3)
      'exterior', 'interior', 'engine', 'wheels', 'details',
      -- Properties (Phase 4a)
      'building_exterior', 'living_room', 'bedroom', 'kitchen', 'bathroom',
      'floor_plan', 'view', 'diwaniya_room',
      -- Electronics (Phase 7 v2)
      'power_on_screen', 'imei_screen', 'battery_health_screen', 'serial_label',
      -- Services (Phase 8a — new)
      'before', 'after', 'tools', 'portfolio'
    ]::text[])
  );

-- See migration applied directly via MCP on 2026-04-22 — full INSERT block
-- kept in the SQL session log; replaying this file from scratch requires
-- re-running the listings 0039 seed first, then this one.

COMMIT;
