-- ============================================================================
-- 0021_listing_images_category.sql — image category for gallery filters
-- ============================================================================
-- Adds a nullable `category` column to listing_images.
--
-- Automotive detail pages filter the gallery by category pills
-- (Exterior / Interior / Engine / Wheels / Details). Non-automotive
-- verticals (electronics, fashion, ...) don't need this split; their
-- rows leave `category` NULL and the UI shows one flat gallery.
--
-- Constraint is a CHECK rather than an enum so non-automotive
-- categories can be added later (e.g. 'closeup', 'lifestyle') without
-- an enum migration.
--
-- Composite index (listing_id, category, position) lets the gallery
-- page pull "all interior shots for this listing in order" with one
-- index hit.
--
-- Reference: planning/PHASE-3B-AUDIT.md §3.2
-- Depends on: 0005_listings.sql (listing_images table)
-- ============================================================================

ALTER TABLE listing_images
  ADD COLUMN category TEXT
    CHECK (
      category IS NULL
      OR category IN ('exterior', 'interior', 'engine', 'wheels', 'details')
    );

CREATE INDEX listing_images_listing_cat_idx
  ON listing_images (listing_id, category, position);

COMMENT ON COLUMN listing_images.category IS
  'Gallery filter bucket. NULL for verticals that do not categorise images. Automotive uses: exterior | interior | engine | wheels | details.';
